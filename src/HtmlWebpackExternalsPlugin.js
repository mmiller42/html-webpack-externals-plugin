import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackIncludeAssetsPlugin from 'html-webpack-include-assets-plugin'
import Ajv from 'ajv'

export default class HtmlWebpackExternalsPlugin {
	static validateArguments = (() => {
		const ajv = new Ajv({ useDefaults: true })
		const validateConfig = ajv.compile({
			type: 'object',
			properties: {
				externals: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							module: { type: 'string' },
							entry: {
								type: ['string', 'array'],
								items: { type: 'string' },
								minItems: 1,
							},
							global: { type: ['string', 'null'], default: null },
							supplements: {
								type: 'array',
								items: { type: 'string' },
								default: [],
							},
							append: { type: 'boolean', default: false },
						},
						required: ['module', 'entry'],
					},
					minItems: 1,
				},
				hash: { type: 'boolean', default: false },
				outputPath: { type: 'string', default: 'vendor' },
				publicPath: { type: ['string', 'null'], default: null },
			},
			required: ['externals'],
		})

		return config => {
			if (!validateConfig(config)) {
				throw new TypeError(ajv.errorsText(validateConfig.errors))
			}
		}
	})()

	static URL_ENTRY = /^(http:|https:)?\/\//

	constructor(config) {
		HtmlWebpackExternalsPlugin.validateArguments(config)

		this.assetsToPrepend = []
		this.assetsToAppend = []
		this.assetsToCopy = []
		this.externals = {}

		const { externals, hash, outputPath, publicPath } = config
		this.hash = hash
		this.outputPath = outputPath
		this.publicPath = publicPath

		externals.forEach(({ module, entry, global, supplements, append }) => {
			this.externals[module] = global

			const localEntries = []

			const entries = (Array.isArray(entry) ? entry : [entry]).map(entry => {
				if (HtmlWebpackExternalsPlugin.URL_ENTRY.test(entry)) {
					return entry
				}
				const localEntry = `${module}/${entry}`
				localEntries.push(localEntry)
				return localEntry
			})

			if (append) {
				this.assetsToAppend = [...this.assetsToAppend, ...entries]
			} else {
				this.assetsToPrepend = [...this.assetsToPrepend, ...entries]
			}

			this.assetsToCopy = [
				...this.assetsToCopy,
				...localEntries,
				...supplements.map(asset => `${module}/${asset}`),
			]
		})
	}

	apply(compiler) {
		if (!compiler.options.externals) {
			compiler.options.externals = this.externals
		} else if (Array.isArray(compiler.options.externals)) {
			compiler.options.externals.push(this.externals)
		} else if (typeof compiler.options.externals === 'object') {
			compiler.options.externals = {
				...compiler.options.externals,
				...this.externals,
			}
		}

		const publicPath =
			this.publicPath == null
				? compiler.options.output.publicPath
				: this.publicPath

		const pluginsToApply = []

		pluginsToApply.push(
			new CopyWebpackPlugin(
				this.assetsToCopy.map(asset => ({
					from: `node_modules/${asset}`,
					to: `${this.outputPath}/${asset}`,
				}))
			)
		)

		const createAssetsPlugin = (assets, append) => {
			if (assets.length) {
				pluginsToApply.push(
					new HtmlWebpackIncludeAssetsPlugin({
						assets: assets.map(
							asset =>
								HtmlWebpackExternalsPlugin.URL_ENTRY.test(asset)
									? asset
									: `${publicPath}${this.outputPath}/${asset}`
						),
						append,
						hash: this.hash,
						publicPath: '',
					})
				)
			}
		}

		createAssetsPlugin(this.assetsToPrepend, false)
		createAssetsPlugin(this.assetsToAppend, true)

		pluginsToApply.forEach(plugin => plugin.apply(compiler))
	}
}
