import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackIncludeAssetsPlugin from 'html-webpack-include-assets-plugin'
import Ajv from 'ajv'

const ajv = new Ajv()
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
					global: { type: ['string', 'null'] },
					supplements: {
						type: 'array',
						items: { type: 'string' },
					},
					append: { type: 'boolean' },
				},
				required: ['module', 'entry'],
			},
			minItems: 1,
		},
		hash: { type: 'boolean' },
		outputPath: { type: 'string' },
		publicPath: { type: ['string', 'boolean'] },
	},
	required: ['externals'],
})

export default class HtmlWebpackExternalsPlugin {
	static validateArguments(config) {
		if (!validateConfig(config)) {
			throw new TypeError(ajv.errorsText(validateConfig.errors))
		}
	}

	constructor(config) {
		HtmlWebpackExternalsPlugin.validateArguments(config)

		this.assetsToPrepend = []
		this.assetsToAppend = []
		this.assetsToCopy = []
		this.externals = {}

		const {
			externals,
			hash = false,
			outputPath = 'vendor',
			publicPath = true,
		} = config
		this.hash = hash
		this.outputPath = outputPath
		this.publicPath = publicPath

		externals.forEach(
			({ module, entry, global = null, supplements = [], append = false }) => {
				this.externals[module] = global

				const entries = (Array.isArray(entry) ? entry : [entry]).map(
					entry => `${module}/${entry}`
				)

				if (append) {
					this.assetsToAppend = [...this.assetsToAppend, ...entries]
				} else {
					this.assetsToPrepend = [...this.assetsToPrepend, ...entries]
				}

				this.assetsToCopy = [
					...this.assetsToCopy,
					...entries,
					...supplements.map(asset => `${module}/${asset}`),
				]
			}
		)
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
						assets: assets.map(asset => `${this.outputPath}/${asset}`),
						append,
						hash: this.hash,
						publicPath: this.publicPath,
					})
				)
			}
		}

		createAssetsPlugin(this.assetsToPrepend, false)
		createAssetsPlugin(this.assetsToAppend, true)

		pluginsToApply.forEach(plugin => plugin.apply(compiler))
	}
}
