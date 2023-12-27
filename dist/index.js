// src/index.ts
import * as path7 from "path";
import * as process6 from "process";

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright color
    blackBright: [90, 39],
    gray: [90, 39],
    // Alias of `blackBright`
    grey: [90, 39],
    // Alias of `blackBright`
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright color
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    // Alias of `bgBlackBright`
    bgGrey: [100, 49],
    // Alias of `bgBlackBright`
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = /* @__PURE__ */ new Map();
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          /* eslint-disable no-bitwise */
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
          /* eslint-enable no-bitwise */
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
import process from "process";
import os from "os";
import tty from "tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = process;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function envForceColor() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== void 0) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === void 0) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process.platform === "win32") {
    const osRelease = os.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if ("GITHUB_ACTIONS" in env || "GITEA_ACTIONS" in env) {
      return 3;
    }
    if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
    endIndex = index + 1;
    index = string.indexOf("\n", endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
var styles2 = /* @__PURE__ */ Object.create(null);
var applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === void 0 ? colorLevel : options.level;
};
var chalkFactory = (options) => {
  const chalk2 = (...strings) => strings.join(" ");
  applyOptions(chalk2, options);
  Object.setPrototypeOf(chalk2, createChalk.prototype);
  return chalk2;
};
function createChalk(options) {
  return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === "rgb") {
    if (level === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles2[bgModel] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
var proto = Object.defineProperties(() => {
}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level) {
      this[GENERATOR].level = level;
    }
  }
});
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === void 0) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === void 0) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== void 0) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf("\n");
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// src/index.ts
import { loadEnv, splitVendorChunkPlugin } from "vite";
import vue from "@vitejs/plugin-vue";
import basicSsl from "@vitejs/plugin-basic-ssl";
import mkcert from "vite-plugin-mkcert";
import vueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import { visualizer } from "rollup-plugin-visualizer";
import circularDependency from "vite-plugin-circular-dependency";
import legacy from "vite-plugin-legacy-extends";
import svgLoader from "vite-svg-loader";

// src/utils/createClassNameHash.ts
import path from "path";
import crypto from "crypto";
import process2 from "process";
var hashMap = {};
function getUniqueName(content, p) {
  const hash = crypto.createHash("md5");
  hash.update(content);
  const hashText = hash.digest("hex").substring(0, 5);
  if (!hashMap[hashText]) {
    hashMap[hashText] = p;
    return hashText;
  }
  if (hashMap[hashText] === p)
    return hashText;
  return getUniqueName(`${content}~`, p);
}
function createClassNamehash(args) {
  const { root, name, filename, prefix, classCompress = true } = args;
  const p = `${path.relative(root, filename).replace(/\\/g, "/")}--${name}`;
  const basename = path.basename(filename).replace(/(\.module)?\.(css|less|scss)/, "").replace(/\./g, "_");
  const dirname = path.basename(path.dirname(filename));
  const content = `${prefix}:${p}`;
  const hash = getUniqueName(content, p);
  const cls = process2.env.NODE_ENV === "development" || !classCompress ? `${dirname}_${basename}_${name}__${hash}` : `${hash}`;
  return prefix ? `${prefix}${cls}` : cls;
}

// src/plugins/cssModulesDtsPlugin.ts
import process4 from "process";

// src/utils/cssModulesDts.ts
import path2 from "path";
import process3 from "process";
import { pathToFileURL } from "url";
import watch from "node-watch";
import * as sass from "sass";
import { glob } from "glob";
import { minimatch } from "minimatch";
import DtsCreator from "typed-css-modules";
var RealDtsCreator = DtsCreator.default;
var start = (opts = {}) => {
  const {
    root = process3.cwd(),
    files = ["**/*.module.scss"],
    generateAll = true,
    alias = []
  } = opts;
  const creator = new RealDtsCreator({
    rootDir: root,
    namedExports: true,
    camelCase: "none"
  });
  async function updateFile(f) {
    try {
      const out = await sass.compileAsync(f, {
        importers: [
          {
            findFileUrl(url) {
              for (const item of alias) {
                if (typeof item.find === "string") {
                  if (url.startsWith(item.find)) {
                    const p = path2.join(
                      item.replacement,
                      url.substring(item.find.length)
                    );
                    const res = pathToFileURL(p);
                    return res;
                  }
                }
                if (item.find instanceof RegExp) {
                  if (item.find.test(url)) {
                    const p = url.replace(item.find, item.replacement);
                    const res = pathToFileURL(p);
                    return res;
                  }
                }
              }
              return null;
            }
          }
        ]
      });
      const content = await creator.create(f, out.css, true);
      return await content.writeFile(() => content.formatted || "");
    } catch (e) {
      console.log("[cssModulesDts Error]");
      console.error(e);
    }
  }
  try {
    let watchers = [];
    files.forEach((p) => {
      if (generateAll) {
        glob(p, {
          cwd: root
        }).then((files2) => {
          files2.forEach((f) => {
            updateFile(path2.resolve(root, f));
          });
        });
      }
      const watcher = watch(
        root,
        {
          recursive: true,
          filter: (f) => minimatch(f, p)
        },
        (evt, name) => {
          if (evt === "update")
            updateFile(name);
        }
      );
      watcher.on("error", (e) => {
        console.log("[cssModulesDts Error]");
        console.log(e);
      });
      watchers.push(watcher);
    });
    const stop = () => {
      watchers.forEach((watcher) => {
        watcher.close();
      });
      watchers = [];
    };
    return stop;
  } catch (e) {
    console.log("[cssModulesDts Error]");
    console.log(e);
  }
};

// src/plugins/cssModulesDtsPlugin.ts
var cssModulesDtsPlugin = (options = {}) => {
  let root = "";
  let alias = [];
  let stop;
  return {
    name: "luban:css-moduless-dts",
    configResolved: (conf) => {
      root = conf.root;
      alias = conf.resolve.alias;
    },
    buildStart: () => {
      const started = !!process4.env.LUBAN_CSS_MODULES_DTS_PLUGIN_STARTED;
      const { files = ["**/*.module.scss"] } = options;
      stop = start({ root, files, generateAll: !started, alias });
      process4.env.LUBAN_CSS_MODULES_DTS_PLUGIN_STARTED = "true";
    },
    buildEnd: () => {
      stop?.();
    }
  };
};
var cssModulesDtsPlugin_default = cssModulesDtsPlugin;

// src/plugins/envDtsPlugin.ts
import path4 from "path";

// src/utils/envDts.ts
import path3 from "path";
import * as fs from "fs";
import watch2 from "node-watch";
import dotenv from "dotenv";
import { minimatch as minimatch2 } from "minimatch";
var start2 = (opts) => {
  const { envDir, filename, name } = opts;
  const generate2 = async () => {
    const dirs = await fs.promises.readdir(envDir);
    let str = `interface ${name} {
`;
    const readList = [];
    for (const dir of dirs) {
      const f = path3.join(envDir, dir);
      const text = await fs.promises.readFile(f, "utf-8");
      const parsed = dotenv.parse(text);
      Object.keys(parsed).forEach((key) => {
        if (readList.includes(key))
          return;
        readList.push(key);
        str += `  readonly ${key}: string;
`;
      });
    }
    str += "}\n";
    await fs.promises.writeFile(filename, str);
  };
  if (!fs.existsSync(envDir)) {
    console.log(`[envDts] envDir not exists!`);
    return;
  }
  try {
    let watchers = [];
    const watcher = watch2(
      path3.join(envDir),
      {
        recursive: true,
        filter: (f) => minimatch2(f, "*.env*")
      },
      (evt, _) => {
        if (evt === "update") {
          generate2();
        }
      }
    );
    watcher.on("error", (e) => {
      console.log("[envDts Error]");
      console.log(e);
    });
    watchers.push(watcher);
    generate2();
    const stop = () => {
      watchers.forEach((watcher2) => {
        watcher2.close();
      });
      watchers = [];
    };
    return stop;
  } catch (e) {
    console.log(`[envDts Error]`);
    console.log(e);
  }
};

// src/plugins/envDtsPlugin.ts
var envDtsPlugin = (options = {}) => {
  const { name = "CustomProcessEnv", filename } = options;
  let root = "";
  let envDir = "";
  let stop;
  return {
    name: "luban:env-dts",
    configResolved: (conf) => {
      root = conf.root;
      envDir = conf.envDir;
    },
    buildStart: () => {
      const f = filename || path4.resolve(root, "custom-env.d.ts");
      stop = start2({ envDir, filename: f, name });
    },
    buildEnd: () => {
      stop?.();
    }
  };
};
var envDtsPlugin_default = envDtsPlugin;

// src/plugins/sitemapPlugin.ts
import process5 from "process";
import path6 from "path";

// src/utils/sitemap/sitemap.ts
import path5 from "path";
import fs2 from "fs";
import ejs from "ejs";

// src/utils/sitemap/template.ts
var template_default = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <% urls.forEach(function(url){ %>
  <url>
    <loc><%= url.loc %></loc>
    <% url.alternates.forEach(function(alternate){ %>
    <xhtml:link rel="alternate" hreflang="<%= alternate.lang %>" href="<%= alternate.link %>" />
    <% }); %>   
    <priority><%= \`\${url.priority || 1.0}\` %></priority>
  </url>
  <% }); %>
</urlset>
`;

// src/utils/sitemap/sitemap.ts
var getUrl = (opts) => {
  const {
    domain,
    page,
    lang,
    getLanguagePath = (p2, l) => {
      return path5.join("/", l, p2);
    }
  } = opts;
  const defaultLang = page.defaultLanguage || opts.defaultLanguage;
  const pathWithLang = lang && lang !== defaultLang;
  const p = pathWithLang ? getLanguagePath(page.path, lang) : path5.join("/", page.path);
  return `https://${domain}${p}`;
};
var generateDomain = async (opts) => {
  const { domain, languages, defaultLanguage, pages, getLanguagePath, filename } = opts;
  const generatePage = (page) => {
    const langs = page.languages || languages;
    const generateLang = (lang) => {
      const loc = getUrl({
        domain,
        page,
        lang,
        defaultLanguage,
        getLanguagePath
      });
      const alternates = [];
      for (const item of langs) {
        alternates.push({
          lang: item,
          link: getUrl({
            domain,
            page,
            lang: item,
            defaultLanguage,
            getLanguagePath
          })
        });
      }
      return {
        loc,
        priority: page.priority,
        alternates
      };
    };
    const res2 = [];
    for (const item of langs.length ? langs : [""]) {
      res2.push(generateLang(item));
    }
    return res2;
  };
  const res = [];
  for (const item of pages) {
    res.push(...generatePage(item));
  }
  const file = filename(domain);
  const content = ejs.render(template_default, { urls: res }).replace(/\n[\r\n\s]+\n/g, "\n").replace(/(^\s+)|(\s+$)/g, "");
  await fs2.promises.writeFile(file, content, "utf-8");
};
var generate = async (options) => {
  for (const d of options.domains) {
    await generateDomain({
      domain: d,
      pages: options.pages,
      languages: options.languages,
      defaultLanguage: options.defaultLanguage,
      getLanguagePath: options.getLanguagePath,
      filename: options.filename
    });
  }
};

// src/plugins/sitemapPlugin.ts
var sitemapPlugin = (options) => {
  let root = "";
  let stop;
  return {
    name: "luban:sitemap",
    configResolved: (conf) => {
      root = conf.root;
    },
    buildStart: () => {
      const started = !!process5.env.LUBAN_SITEMAP_PLUGIN_STARTED;
      if (started) {
        return;
      }
      generate({
        domains: options.domains,
        pages: options.pages,
        languages: options.languages,
        defaultLanguage: options.defaultLanguage,
        getLanguagePath: options.getLanguagePath,
        filename: (d) => {
          if (options.domains.length > 1) {
            return path6.resolve(root, `${d}.sitemap.xml`);
          }
          return path6.resolve(root, `sitemap.xml`);
        }
      });
      process5.env.LUBAN_SITEMAP_PLUGIN_STARTED = "true";
    },
    buildEnd: () => {
      stop?.();
    }
  };
};
var sitemapPlugin_default = sitemapPlugin;

// src/index.ts
var esTargets = ["es2015", "chrome87", "safari13", "firefox78", "edge88"];
var babelTargets = [
  "defaults",
  "chrome >= 87",
  "safari >= 13",
  "firefox >= 78",
  "edge >= 88"
];
var legacyTargets = [
  "defaults",
  "chrome >= 87",
  "safari >= 13",
  "firefox >= 78",
  "edge >= 88",
  "android >= 7.1"
];
function viteLubanVuePlugin(opts = {}) {
  const root = opts.root ?? process6.cwd();
  const normalizePaths = (p) => {
    if (Array.isArray(p)) {
      return p.map((v) => {
        return normalizePaths(v);
      });
    }
    if (path7.isAbsolute(p))
      return p;
    return path7.resolve(root, p);
  };
  const lubanConfigPlugin = {
    name: "luban:config",
    async config(config, { mode }) {
      const confRoot = config.root || process6.cwd();
      const envPrefixSet = new Set(config.envPrefix ?? []);
      ["VITE_", "NODE_", "__VUE_", "__INTLIFY_"].forEach((v) => {
        envPrefixSet.add(v);
      });
      const envPrefix = [...envPrefixSet];
      const envDir = config.envDir ?? path7.resolve(confRoot, "./envs");
      const env2 = loadEnv(mode, envDir, envPrefix);
      const base = config.base || "/";
      return {
        root: confRoot,
        base,
        envDir,
        envPrefix,
        define: {
          __VUE_PROD_DEVTOOLS__: env2["process.env.NODE_ENV"] === "development",
          __VUE_I18N_LEGACY_API_: false,
          __VUE_I18N_FULL_INSTALL__: false,
          __INTLIFY_PROD_DEVTOOLS__: false
        },
        resolve: {
          alias: {
            "vue-i18n": "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js"
          }
        },
        server: {
          host: "0.0.0.0"
        },
        css: {
          modules: {
            generateScopedName(name, filename) {
              return createClassNamehash({
                root,
                name,
                filename,
                prefix: "lb-",
                classCompress: true
              });
            }
          }
        },
        build: {
          target: config.build?.target ?? esTargets
        },
        minify: config.build?.minify ?? "terser",
        rollupOptions: {
          maxParallelFileOps: config.build?.rollupOptions?.maxParallelFileOps ?? 5,
          output: {
            sourcemap: config.build?.rollupOptions?.output?.sourcemap ?? false,
            manualChunks: config.build?.rollupOptions?.output?.manualChunks ?? ((id) => {
              if (/node_modules\/(@vue|vue|vue-router|vue-i18n|@intlify|pinia|pinia-di)\//.test(
                id
              ))
                return "vue";
              if (/node_modules\/(@vee-validate\/rules|vee-validate)\//.test(id))
                return "validate";
              if (/node_modules\//.test(id))
                return "vendor";
            })
          }
        },
        experimental: {
          renderBuiltUrl(filename) {
            const ext = path7.extname(filename);
            const cndUrl = (opts.cdn?.url || "").replace(/\/$/, "");
            const pattern = opts.cdn?.assetsPattern || /\.(js|css|jpg|jpeg|png|gif|ico|svg|eot|woff|woff2|ttf|swf|mp3|mp4|wov|avi|flv|ogg|mpeg4|webm)$/;
            if (pattern.test(ext) && cndUrl) {
              return `${cndUrl}/${filename}`;
            }
            return { relative: true };
          }
        }
      };
    },
    configResolved: (conf) => {
      if (conf.root !== root) {
        console.log(source_default.red(`[@luban-ui/vite-plugin-vue] This plugin's root [${root}] is not match with vite's root [${conf.root}], the website may not run properly.`));
        console.log(source_default.red(`[@luban-ui/vite-plugin-vue] Please clearly pass the root parameter to this plugin and vite!`));
      }
    }
  };
  const plugins = [
    lubanConfigPlugin
  ];
  if (opts.cssModulesDts?.enable !== false) {
    plugins.push(
      cssModulesDtsPlugin_default(opts.cssModulesDts?.options)
    );
  }
  if (opts.envDts?.enable !== false) {
    plugins.push(
      envDtsPlugin_default(opts.envDts?.options)
    );
  }
  if (opts.sitemap?.enable && opts.sitemap?.options) {
    plugins.push(
      sitemapPlugin_default(opts.sitemap?.options)
    );
  }
  if (opts.vue?.enable !== false)
    plugins.push(vue({
      ...opts.vue?.options
    }));
  if (opts.ssl?.enable !== false) {
    plugins.push(basicSsl());
  }
  if (opts.mkcert?.enable) {
    plugins.push(mkcert({
      source: "coding",
      ...opts.mkcert?.options
    }));
  }
  if (opts.svg?.enable !== false) {
    plugins.push(
      svgLoader({
        defaultImport: "url",
        ...opts.svg?.options
      })
    );
  }
  if (opts.i18n?.enable !== false) {
    plugins.push(
      vueI18nPlugin({
        include: normalizePaths(
          "src/i18n/locales/**/*.json"
        ),
        ...opts.i18n?.options
      })
    );
  }
  if (opts.visualizer?.enable !== false) {
    plugins.push(
      visualizer({
        emitFile: true,
        filename: "stats.html",
        ...opts.visualizer?.options
      })
    );
  }
  if (opts.circularDependency?.enable !== false) {
    plugins.push(
      circularDependency({
        exclude: /node_modules\//,
        ...opts.circularDependency?.options
      })
    );
  }
  if (opts.split?.enable !== false)
    plugins.push(splitVendorChunkPlugin());
  if (opts.legacy?.enable !== false) {
    plugins.push(
      legacy({
        targets: legacyTargets,
        modernPolyfills: true,
        modernTargets: babelTargets,
        ...opts.legacy?.options
      })
    );
  }
  return plugins;
}
var src_default = viteLubanVuePlugin;
export {
  src_default as default
};