'use strict';

var fs = require('fs');
var path = require('path');
var resolve = require('require-resolve');

function HtmlWebpackExternalsPlugin (externals, options) {
	this._externals = externals;
	this._options = options;
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

	var assets = {};
	self._externals.forEach(function (external) {
		if (typeof external.name !== 'string') {
			throw new Error('The external must have a `name` string.');
		}

		if (external.var !== undefined && typeof external.var !== 'string') {
			throw new Error('The external `var` must be a string.');
		}

		if (external.url !== undefined && external.path !== undefined) {
			throw new Error('Either `url` or `path` may be defined for a given external, but not both.');
		}

		if (external.path !== undefined) {
			if (typeof external.path !== 'string') {
				throw new Error('The external `path` must be a string.');
			}

			try {
				// require-resolve assumes the path given is a file and calls path.dirname()
				// Adding another layer (just "dir") to the basedir will prevent it from
				// moving up one level too high in the directory hierarchy.
				var absPath = resolve(external.path, path.join(self._options.basedir, 'dir')).src;
				var dest = path.join(self._options.dest || 'vendor', external.path);
				var stat = fs.statSync(absPath);
			} catch (fileErr) {
				var err = new Error('Unable to resolve the external `path` `' + external.path + '`.');
				err.originalErr = fileErr;
				throw err;
			}
			assets[dest] = {
				size: function () {
					return stat.size;
				},
				source: function () {
					return fs.readFileSync(absPath);
				}
			};
			external._href = dest.replace(/\\/g, '/');
		} else if (external.url !== undefined) {
			if (typeof external.url !== 'string') {
				throw new Error('The external `url` must be a string.');
			}

			external._href = external.url;
		} else {
			throw new Error('Either `url` or `path` must be defined for a given external.');
		}
	});

	var externalChunks = self._externals
		.filter(function (external) {
			return !/\.css($|\?)$/.test(external._href);
		})
		.map(function (external) {
			return {
				names: [external.name],
				files: [external._href]
			};
		});

	var externalCssFiles = self._externals
		.filter(function (external) {
			return /\.css($|\?)$/.test(external._href);
		})
		.map(function (external) {
			return external._href;
		});

	compiler.plugin('compilation', function (compilation) {
		Object.assign(compilation.assets, assets);
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
