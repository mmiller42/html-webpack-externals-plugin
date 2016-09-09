'use strict';

function HtmlWebpackExternalsPlugin (externals) {
	this._externals = externals;
}

HtmlWebpackExternalsPlugin.prototype.apply = function (compiler) {
	var self = this;
	compiler.options.externals = compiler.options.externals || {};

	if (Array.isArray(compiler.options.externals)) {
		self._externals.forEach(function (external) {
			var obj = {};
			obj[external.name] = external.var === undefined ? 'undefined' : external.var;
			compiler.options.externals.push(obj);
		});
	} else if (typeof compiler.options.externals === 'object') {
		self._externals.forEach(function (external) {
			compiler.options.externals[external.name] = external.var === undefined ? 'undefined' : external.var;
		});
	} else {
		throw new Error('This plugin only works if the existing `externals` is an object or array');
	}

	var externalChunks = self._externals
		.filter(function (external) {
			return !/\.css($|\?)$/.test(external.url);
		})
		.map(function (external) {
			return {
				names: [external.name],
				files: [external.url]
			};
		});

	var externalCssFiles = self._externals
		.filter(function (external) {
			return /\.css($|\?)$/.test(external.url);
		})
		.map(function (external) {
			return external.url;
		});

	compiler.plugin('compilation', function (compilation) {
		compilation.plugin('html-webpack-plugin-alter-chunks', function (chunks) {
			var entry = chunks[0].files.shift();
			chunks[0].files = externalCssFiles.concat(chunks[0].files);
			chunks[0].files.unshift(entry);

			chunks = externalChunks.concat(chunks);
			return chunks;
		});
	});
};

module.exports = HtmlWebpackExternalsPlugin;
