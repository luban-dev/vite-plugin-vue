declare module 'vite-plugin-circular-dependency' {
  import type { FilterPattern } from '@rollup/pluginutils';
  import type { ModuleNode } from '../module/moduleNode';
  export type CircleData = Record<string, ModuleNode['moduleId'][][]>;
  export interface Options {
      /**
       * Rules to include transforming target.
       *
       * @default [/\.[jt]sx?$/, /\.vue\??/]
       */
      include?: FilterPattern;
      /**
       * Rules to exclude scan target.
       *
       * @default [/node_modules/, /\.git/]
       */
      exclude?: FilterPattern;
      /**
       * The file address of the scan result output, the default console print
       */
      outputFilePath?: string;
      /**
       * Whether to throw an error when a circular import exists
       *
       * @default true
       */
      circleImportThrowErr?: boolean;
      /**
       * Format the path of the output node.
       * By default, vite.config will be used as the root path to generate a relative path
       *
       * @default function
       */
      formatOutModulePath?: (path: string) => string;
      /**
       * The result of formatted output
       * will also affect the data format in the console print or output file
       *
       * @default (data: CircleData) => data
       */
      formatOut?: (data: CircleData) => any;
  }

  declare const _default: (options: Options) => Plugin;
  export default _default;
}