import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackIncludeAssetsPlugin from 'html-webpack-include-assets-plugin'
import Ajv from 'ajv'

const validateConfig = new Ajv().compile({
	type: 'object',
	properties: {
		externals: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					module: { type: 'string' },
					global: { type: ['string', 'null'] },
					entry: {
						type: ['string', 'array'],
						items: { type: 'string' },
						minItems: 1,
					},
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
	},
	required: ['externals'],
})

export default class HtmlWebpackExternalsPlugin {
	static validateArguments(config) {
		if (!validateConfig(config)) {
			throw validateConfig.errors
		}
	}

	constructor(config) {
		HtmlWebpackExternalsPlugin.validateArguments(config)

		this.assetsToPrepend = []
		this.assetsToAppend = []
		this.assetsToCopy = []
		this.externals = {}

		const { externals, hash, outputPath } = config
		this.hash = hash
		this.outputPath = outputPath

		externals.forEach(
			({ module, entry, global = null, supplements = [], append = true }) => {
				this.externals[module] = global

				const entries = Array.isArray(entry)
					? entry
					: [entry].map(entry => `${module}/${entry}`)

				if (append) {
					this.assetsToAppend = [...this.assetsToAppend, ...entries]
				} else {
					this.assetsToPrepend = [...this.assetsToPrepend, ...entries]
				}

				if (supplements.length) {
					this.assetsToCopy = [
						...this.assetsToCopy,
						...entries,
						...supplements.map(asset => `${module}/${asset}`),
					]
				}
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
				this.assetsToCopy.map(asset => `node_modules/${asset}`)
			)
		)

		if (this.assetsToPrepend.length) {
			pluginsToApply.push(
				new HtmlWebpackIncludeAssetsPlugin({
					assets: this.assetsToPrepend.map(
						asset => `${this.outputPath}/${asset}`
					),
					append: false,
					hash: this.hash,
				})
			)
		}

		if (this.assetsToAppend.length) {
			pluginsToApply.push(
				new HtmlWebpackIncludeAssetsPlugin({
					assets: this.assetsToAppend.map(
						asset => `${this.outputPath}/${asset}`
					),
					append: true,
					hash: this.hash,
				})
			)
		}

		pluginsToApply.forEach(plugin => plugin.apply(compiler))
	}
}
