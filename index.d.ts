import copyWebpackPlugin = require("copy-webpack-plugin");

type CwpParams = ConstructorParameters<typeof copyWebpackPlugin>;
type CopyPattern = Exclude<CwpParams[0][0],string>
type CopyWebpackPluginConfiguration = CwpParams[1];

declare interface CopySpec {
    path: string,
    dist?: string,
    cwpPatternConfig?: CopyPattern,
}

declare interface EntrySpec extends CopySpec {
    type?: 'js' | 'css',
    attributes?: Record<string,string>
};

declare interface ExternalsDefinition {
    module: string,
    dist?: string,
    entry: string | EntrySpec | Array<string | EntrySpec>,
    global?: string | null,
    supplements: Array<string | CopySpec>,
    append?: boolean,
}

export = class HtmlWebpackExternalsPlugin {
    constructor(options: {
        externals: ExternalsDefinition[],
        hash?: boolean,
        outputPath?: string,
        publicPath?: string | null,
        files?: string | string[] | null,
        cwpOptions?: CopyWebpackPluginConfiguration,
        enabled?: boolean,
    });
}