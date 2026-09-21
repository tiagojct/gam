// Editor formats: VS Code, Zed, Neovim (Lua), Obsidian CSS snippet.
import { view, header, json, kebab, modesOf } from './common.js';
import { withAlpha } from '../colour/hex.js';

const italic = (s) => (s.style === 'italic' ? 'italic' : undefined);
const bold = (s) => (s.style === 'bold' ? 'bold' : undefined);

export const vscode = {
  id: 'vscode', label: 'VS Code theme', group: 'editors', ext: 'json', mime: 'application/json',
  generate(fam, opts) {
    return modesOf(opts.mode).map((mode) => {
      const v = view(fam, { ...opts, mode });
      const r = v.roles, s = v.syntax, t = v.terminal;
      const fontStyle = (x) => [italic(x), bold(x)].filter(Boolean).join(' ') || undefined;
      const tok = (name, scope, x) => ({ name, scope, settings: { foreground: x.hex, ...(fontStyle(x) ? { fontStyle: fontStyle(x) } : {}) } });
      const theme = {
        $schema: 'vscode://schemas/color-theme',
        name: `${v.name} ${v.modeLabel} (Gam)`,
        type: v.scheme,
        semanticHighlighting: true,
        colors: {
          'editor.background': r.bg, 'editor.foreground': s.variable.hex,
          'editor.lineHighlightBackground': withAlpha(r.surface, 0.6), 'editor.selectionBackground': withAlpha(r.selection, 0.8),
          'editor.inactiveSelectionBackground': withAlpha(r.selection, 0.4), 'editor.findMatchBackground': withAlpha(r.accent, 0.4),
          'editor.findMatchHighlightBackground': withAlpha(r.accent, 0.2), 'editor.wordHighlightBackground': withAlpha(r.textSubtle, 0.2),
          'editorCursor.foreground': t.cursor, 'editorLineNumber.foreground': r.textSubtle, 'editorLineNumber.activeForeground': r.text,
          'editorIndentGuide.background1': r.border, 'editorWhitespace.foreground': r.border, 'editorBracketMatch.border': r.accent,
          'editorGutter.background': r.bg, 'editorWidget.background': r.surface, 'editorWidget.border': r.border,
          'editorHoverWidget.background': r.surface, 'editorSuggestWidget.background': r.surface, 'editorSuggestWidget.selectedBackground': r.selection,
          foreground: r.text, descriptionForeground: r.textMuted, focusBorder: r.focus, errorForeground: s.keyword.hex,
          'widget.shadow': withAlpha(r.bg, 0.5), 'selection.background': withAlpha(r.selection, 0.8),
          'sideBar.background': r.surface, 'sideBar.foreground': r.text, 'sideBar.border': r.border, 'sideBarTitle.foreground': r.textMuted,
          'sideBarSectionHeader.background': r.surface, 'sideBarSectionHeader.foreground': r.text,
          'activityBar.background': r.surface, 'activityBar.foreground': r.text, 'activityBar.inactiveForeground': r.textSubtle,
          'activityBar.border': r.border, 'activityBar.activeBorder': r.accent, 'activityBarBadge.background': r.button, 'activityBarBadge.foreground': r.onButton,
          'statusBar.background': r.surface, 'statusBar.foreground': r.textMuted, 'statusBar.border': r.border,
          'statusBar.noFolderBackground': r.surface, 'statusBar.debuggingBackground': r.button, 'statusBar.debuggingForeground': r.onButton,
          'titleBar.activeBackground': r.surface, 'titleBar.activeForeground': r.text, 'titleBar.inactiveBackground': r.surface, 'titleBar.inactiveForeground': r.textMuted, 'titleBar.border': r.border,
          'tab.activeBackground': r.bg, 'tab.activeForeground': r.text, 'tab.inactiveBackground': r.surface, 'tab.inactiveForeground': r.textMuted,
          'tab.border': r.border, 'tab.activeBorderTop': r.accent, 'editorGroupHeader.tabsBackground': r.surface, 'editorGroupHeader.tabsBorder': r.border,
          'editorGroup.border': r.border, 'panel.background': r.bg, 'panel.border': r.border, 'panelTitle.activeBorder': r.accent, 'panelTitle.activeForeground': r.text, 'panelTitle.inactiveForeground': r.textMuted,
          'list.activeSelectionBackground': r.selection, 'list.activeSelectionForeground': r.text, 'list.inactiveSelectionBackground': withAlpha(r.selection, 0.6),
          'list.hoverBackground': r.surface, 'list.highlightForeground': r.accent, 'list.focusOutline': r.focus,
          'input.background': r.bg, 'input.foreground': r.text, 'input.border': r.border, 'input.placeholderForeground': r.textSubtle, 'inputOption.activeBorder': r.accent,
          'dropdown.background': r.surface, 'dropdown.foreground': r.text, 'dropdown.border': r.border,
          'button.background': r.button, 'button.foreground': r.onButton, 'button.hoverBackground': r.button, 'button.secondaryBackground': r.surface, 'button.secondaryForeground': r.text,
          'badge.background': r.button, 'badge.foreground': r.onButton, 'progressBar.background': r.accent,
          'textLink.foreground': r.link, 'textLink.activeForeground': r.linkHover, 'textPreformat.foreground': s.string.hex, 'textBlockQuote.border': r.accent,
          'scrollbarSlider.background': withAlpha(r.textSubtle, 0.25), 'scrollbarSlider.hoverBackground': withAlpha(r.textSubtle, 0.4), 'scrollbarSlider.activeBackground': withAlpha(r.textSubtle, 0.5),
          'peekView.border': r.accent, 'peekViewEditor.background': r.surface, 'peekViewResult.background': r.surface, 'peekViewTitle.background': r.surface,
          'notifications.background': r.surface, 'notifications.foreground': r.text, 'notifications.border': r.border, 'notificationCenterHeader.background': r.surface,
          'quickInput.background': r.surface, 'quickInput.foreground': r.text, 'pickerGroup.foreground': r.accent, 'pickerGroup.border': r.border,
          'menu.background': r.surface, 'menu.foreground': r.text, 'menu.selectionBackground': r.selection, 'menu.selectionForeground': r.text, 'menu.border': r.border,
          'breadcrumb.foreground': r.textMuted, 'breadcrumb.focusForeground': r.text, 'breadcrumb.activeSelectionForeground': r.text,
          'gitDecoration.modifiedResourceForeground': s.number.hex, 'gitDecoration.addedResourceForeground': s.string.hex, 'gitDecoration.deletedResourceForeground': s.keyword.hex,
          'gitDecoration.untrackedResourceForeground': s.string.hex, 'gitDecoration.ignoredResourceForeground': r.textSubtle,
          'diffEditor.insertedTextBackground': withAlpha(s.string.hex, 0.15), 'diffEditor.removedTextBackground': withAlpha(s.keyword.hex, 0.15),
          'editorError.foreground': s.keyword.hex, 'editorWarning.foreground': s.number.hex, 'editorInfo.foreground': s.function.hex,
          'terminal.background': t.bg, 'terminal.foreground': t.fg, 'terminalCursor.foreground': t.cursor, 'terminal.selectionBackground': withAlpha(t.selectionBg, 0.8),
          'terminal.ansiBlack': t.ansi[0], 'terminal.ansiRed': t.ansi[1], 'terminal.ansiGreen': t.ansi[2], 'terminal.ansiYellow': t.ansi[3],
          'terminal.ansiBlue': t.ansi[4], 'terminal.ansiMagenta': t.ansi[5], 'terminal.ansiCyan': t.ansi[6], 'terminal.ansiWhite': t.ansi[7],
          'terminal.ansiBrightBlack': t.ansi[8], 'terminal.ansiBrightRed': t.ansi[9], 'terminal.ansiBrightGreen': t.ansi[10], 'terminal.ansiBrightYellow': t.ansi[11],
          'terminal.ansiBrightBlue': t.ansi[12], 'terminal.ansiBrightMagenta': t.ansi[13], 'terminal.ansiBrightCyan': t.ansi[14], 'terminal.ansiBrightWhite': t.ansi[15],
        },
        tokenColors: [
          tok('Comment', ['comment', 'punctuation.definition.comment'], s.comment),
          tok('Keyword', ['keyword', 'keyword.control', 'storage.type', 'storage.modifier'], s.keyword),
          tok('String', ['string', 'string.quoted', 'punctuation.definition.string'], s.string),
          tok('Number', ['constant.numeric', 'constant.language', 'constant.language.boolean'], s.number),
          tok('Constant', ['constant', 'variable.other.constant', 'entity.name.constant'], s.constant),
          tok('Function', ['entity.name.function', 'meta.function-call', 'support.function'], s.function),
          tok('Type', ['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'entity.name.namespace'], s.type),
          tok('Decorator', ['meta.decorator', 'punctuation.definition.decorator', 'entity.name.function.decorator', 'meta.annotation'], s.decorator),
          tok('Variable', ['variable', 'variable.other', 'meta.definition.variable'], s.variable),
          tok('Parameter', ['variable.parameter'], s.parameter),
          tok('Operator', ['keyword.operator'], s.operator),
          tok('Punctuation', ['punctuation', 'meta.brace', 'punctuation.separator'], s.punctuation),
          tok('Tag', ['entity.name.tag'], s.keyword),
          tok('Attribute', ['entity.other.attribute-name'], s.decorator),
          tok('Markup heading', ['markup.heading', 'entity.name.section'], { hex: s.keyword.hex, style: 'bold' }),
          tok('Markup link', ['markup.underline.link', 'string.other.link'], { hex: r.link }),
          tok('Markup raw', ['markup.inline.raw', 'markup.fenced_code.block', 'markup.raw.block'], s.string),
          tok('Markup emphasis', ['markup.italic'], { hex: r.text, style: 'italic' }),
          tok('Markup strong', ['markup.bold'], { hex: r.text, style: 'bold' }),
          tok('Diff inserted', ['markup.inserted'], s.string),
          tok('Diff deleted', ['markup.deleted'], s.keyword),
        ],
        semanticTokenColors: {
          parameter: s.parameter.hex, property: s.variable.hex, type: s.type.hex, class: s.type.hex,
          function: s.function.hex, method: s.function.hex, decorator: s.decorator.hex, enumMember: s.constant.hex,
        },
      };
      return { name: `${kebab(v.name)}-${mode}-color-theme.json`, content: json(theme), mime: this.mime };
    });
  },
};

export const zed = {
  id: 'zed', label: 'Zed theme', group: 'editors', ext: 'json', mime: 'application/json',
  generate(fam, opts) {
    const modes = modesOf(opts.mode);
    const first = view(fam, { ...opts, mode: modes[0] });
    const themes = modes.map((mode) => {
      const v = view(fam, { ...opts, mode });
      const r = v.roles, s = v.syntax, t = v.terminal;
      const syn = (x, extra = {}) => ({ color: x.hex, font_style: x.style === 'italic' ? 'italic' : null, font_weight: x.style === 'bold' ? 700 : null, ...extra });
      const ansiKeys = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
      const style = {
        background: r.bg, 'background.appearance': 'opaque', 'surface.background': r.surface, 'elevated_surface.background': r.surface,
        border: r.border, 'border.variant': r.border, 'border.focused': r.focus, 'border.selected': r.accent, 'border.disabled': r.border,
        text: r.text, 'text.muted': r.textMuted, 'text.placeholder': r.textSubtle, 'text.disabled': r.textSubtle, 'text.accent': r.accent,
        'element.background': r.surface, 'element.hover': r.selection, 'element.active': r.selection, 'element.selected': r.selection,
        'ghost_element.hover': withAlpha(r.selection, 0.5), 'ghost_element.selected': r.selection, 'ghost_element.active': r.selection,
        icon: r.text, 'icon.muted': r.textMuted, 'icon.accent': r.accent,
        'status_bar.background': r.surface, 'title_bar.background': r.surface, 'toolbar.background': r.bg, 'tab_bar.background': r.surface,
        'tab.inactive_background': r.surface, 'tab.active_background': r.bg, 'panel.background': r.surface, 'pane.focused_border': r.accent,
        'scrollbar.thumb.background': withAlpha(r.textSubtle, 0.3), 'scrollbar.track.background': r.bg,
        'editor.background': r.bg, 'editor.foreground': s.variable.hex, 'editor.gutter.background': r.bg, 'editor.active_line.background': withAlpha(r.surface, 0.6),
        'editor.line_number': r.textSubtle, 'editor.active_line_number': r.text, 'editor.invisible': r.border, 'editor.wrap_guide': r.border,
        'editor.document_highlight.read_background': withAlpha(r.textSubtle, 0.2), 'editor.document_highlight.write_background': withAlpha(r.accent, 0.2),
        'search.match_background': withAlpha(r.accent, 0.3), 'link_text.hover': r.linkHover,
        'terminal.background': t.bg, 'terminal.foreground': t.fg, 'terminal.bright_foreground': t.fg, 'terminal.dim_foreground': r.textMuted,
        ...Object.fromEntries(ansiKeys.map((k, i) => [`terminal.ansi.${k}`, t.ansi[i]])),
        ...Object.fromEntries(ansiKeys.map((k, i) => [`terminal.ansi.bright_${k}`, t.ansi[i + 8]])),
        error: s.keyword.hex, 'error.background': withAlpha(s.keyword.hex, 0.15), warning: s.number.hex, 'warning.background': withAlpha(s.number.hex, 0.15),
        info: s.function.hex, hint: r.textMuted, success: s.string.hex, created: s.string.hex, modified: s.number.hex, deleted: s.keyword.hex, conflict: s.keyword.hex,
        players: [{ cursor: t.cursor, background: t.cursor, selection: withAlpha(r.selection, 0.6) }],
        syntax: {
          attribute: syn(s.decorator), boolean: syn(s.number), comment: syn(s.comment), 'comment.doc': syn(s.comment), constant: syn(s.constant),
          constructor: syn(s.type), embedded: syn({ hex: r.text }), emphasis: syn({ hex: r.text, style: 'italic' }), 'emphasis.strong': syn({ hex: r.text, style: 'bold' }),
          enum: syn(s.constant), function: syn(s.function), hint: syn({ hex: r.textMuted }), keyword: syn(s.keyword), label: syn(s.decorator),
          link_text: syn({ hex: r.link }), link_uri: syn({ hex: r.link }), number: syn(s.number), operator: syn(s.operator), predictive: syn({ hex: r.textSubtle, style: 'italic' }),
          preproc: syn(s.decorator), primary: syn({ hex: r.text }), property: syn(s.variable), punctuation: syn(s.punctuation), 'punctuation.bracket': syn(s.punctuation),
          'punctuation.delimiter': syn(s.punctuation), 'punctuation.list_marker': syn(s.keyword), 'punctuation.special': syn(s.operator),
          string: syn(s.string), 'string.escape': syn(s.constant), 'string.regex': syn(s.string), 'string.special': syn(s.constant), 'string.special.symbol': syn(s.constant),
          tag: syn(s.keyword), 'text.literal': syn(s.string), title: syn({ hex: s.keyword.hex, style: 'bold' }), type: syn(s.type), variable: syn(s.variable), 'variable.special': syn(s.parameter),
        },
      };
      return { name: `${v.name} ${v.modeLabel} (Gam)`, appearance: v.scheme, style };
    });
    const out = { $schema: 'https://zed.dev/schema/themes/v0.2.0.json', name: `${first.name} (Gam)`, author: 'Tiago Jacinto', themes };
    return [{ name: `${kebab(first.name)}-gam.json`, content: json(out), mime: this.mime }];
  },
};

export const neovim = {
  id: 'neovim', label: 'Neovim colourscheme (Lua)', group: 'editors', ext: 'lua', mime: 'text/x-lua',
  generate(fam, opts) {
    return modesOf(opts.mode).map((mode) => {
      const v = view(fam, { ...opts, mode });
      const r = v.roles, s = v.syntax, t = v.terminal;
      const name = `${kebab(v.name)}-${mode}`;
      const hl = (group, spec) => `  hi("${group}", { ${Object.entries(spec).filter(([, val]) => val !== undefined).map(([k, val]) => `${k} = ${typeof val === 'string' ? `"${val}"` : val}`).join(', ')} })`;
      const fx = (x) => ({ fg: x.hex, italic: x.style === 'italic' ? true : undefined, bold: x.style === 'bold' ? true : undefined });
      const lines = [
        header(v, 'lua', `Copy to ~/.config/nvim/colors/${name}.lua and :colorscheme ${name}`),
        `vim.cmd("highlight clear")`, `if vim.fn.exists("syntax_on") == 1 then vim.cmd("syntax reset") end`,
        `vim.o.termguicolors = true`, `vim.o.background = "${v.scheme}"`, `vim.g.colors_name = "${name}"`,
        ``, `local function hi(group, spec) vim.api.nvim_set_hl(0, group, spec) end`, ``,
        hl('Normal', { fg: r.text, bg: r.bg }), hl('NormalFloat', { fg: r.text, bg: r.surface }), hl('NormalNC', { fg: r.text, bg: r.bg }),
        hl('Comment', fx(s.comment)), hl('String', fx(s.string)), hl('Character', fx(s.string)), hl('Number', fx(s.number)), hl('Float', fx(s.number)), hl('Boolean', fx(s.number)),
        hl('Constant', fx(s.constant)), hl('Identifier', fx(s.variable)), hl('Function', fx(s.function)), hl('Statement', fx(s.keyword)), hl('Keyword', fx(s.keyword)),
        hl('Conditional', fx(s.keyword)), hl('Repeat', fx(s.keyword)), hl('Operator', fx(s.operator)), hl('Exception', fx(s.keyword)),
        hl('PreProc', fx(s.decorator)), hl('Include', fx(s.keyword)), hl('Define', fx(s.decorator)), hl('Macro', fx(s.decorator)),
        hl('Type', fx(s.type)), hl('StorageClass', fx(s.keyword)), hl('Structure', fx(s.type)), hl('Typedef', fx(s.type)),
        hl('Special', fx(s.constant)), hl('Delimiter', fx(s.punctuation)), hl('Todo', { fg: r.onButton, bg: r.button, bold: true }),
        hl('Underlined', { fg: r.link, underline: true }), hl('Error', { fg: s.keyword.hex }), hl('Title', { fg: s.keyword.hex, bold: true }),
        hl('LineNr', { fg: r.textSubtle, bg: r.bg }), hl('CursorLineNr', { fg: r.text, bold: true }), hl('CursorLine', { bg: r.surface }), hl('ColorColumn', { bg: r.surface }),
        hl('SignColumn', { bg: r.bg }), hl('VertSplit', { fg: r.border }), hl('WinSeparator', { fg: r.border }), hl('Visual', { bg: r.selection }),
        hl('Search', { fg: r.onAccent, bg: r.accent }), hl('IncSearch', { fg: r.onButton, bg: r.button }), hl('CurSearch', { fg: r.onButton, bg: r.button }), hl('MatchParen', { fg: r.accent, bold: true, underline: true }),
        hl('Pmenu', { fg: r.text, bg: r.surface }), hl('PmenuSel', { fg: r.text, bg: r.selection }), hl('PmenuSbar', { bg: r.surface }), hl('PmenuThumb', { bg: r.textSubtle }),
        hl('StatusLine', { fg: r.text, bg: r.surface }), hl('StatusLineNC', { fg: r.textMuted, bg: r.surface }), hl('TabLine', { fg: r.textMuted, bg: r.surface }), hl('TabLineSel', { fg: r.text, bg: r.bg, bold: true }), hl('TabLineFill', { bg: r.surface }),
        hl('NonText', { fg: r.border }), hl('Whitespace', { fg: r.border }), hl('EndOfBuffer', { fg: r.bg }), hl('Directory', { fg: r.link }), hl('Question', { fg: s.string.hex }), hl('MoreMsg', { fg: s.string.hex }),
        hl('ErrorMsg', { fg: s.keyword.hex }), hl('WarningMsg', { fg: s.number.hex }), hl('FloatBorder', { fg: r.border, bg: r.surface }), hl('Cursor', { fg: t.cursorText, bg: t.cursor }),
        hl('DiffAdd', { bg: withAlpha(s.string.hex, 0.15).slice(0, 7) }), hl('DiffDelete', { fg: s.keyword.hex }), hl('DiffChange', { bg: r.surface }), hl('DiffText', { bg: r.selection }),
        hl('DiagnosticError', { fg: s.keyword.hex }), hl('DiagnosticWarn', { fg: s.number.hex }), hl('DiagnosticInfo', { fg: s.function.hex }), hl('DiagnosticHint', { fg: r.textMuted }),
        hl('@comment', { link: 'Comment' }), hl('@string', { link: 'String' }), hl('@number', { link: 'Number' }), hl('@keyword', { link: 'Keyword' }), hl('@function', { link: 'Function' }),
        hl('@function.call', { link: 'Function' }), hl('@type', { link: 'Type' }), hl('@constant', { link: 'Constant' }), hl('@variable', fx(s.variable)), hl('@variable.parameter', fx(s.parameter)),
        hl('@operator', { link: 'Operator' }), hl('@punctuation', { link: 'Delimiter' }), hl('@attribute', fx(s.decorator)), hl('@property', fx(s.variable)), hl('@tag', fx(s.keyword)),
        hl('@markup.heading', { fg: s.keyword.hex, bold: true }), hl('@markup.link.url', { fg: r.link, underline: true }), hl('@markup.raw', fx(s.string)),
        ``,
        ...t.ansi.map((hex, i) => `vim.g.terminal_color_${i} = "${hex}"`),
      ];
      return { name: `${name}.lua`, content: lines.join('\n') + '\n', mime: this.mime };
    });
  },
};

export const obsidian = {
  id: 'obsidian', label: 'Obsidian CSS snippet', group: 'editors', ext: 'css', mime: 'text/css',
  generate(fam, opts) {
    const modes = modesOf(opts.mode);
    const first = view(fam, { ...opts, mode: modes[0] });
    let out = header(first, 'css', 'Save under .obsidian/snippets/ and enable it in Appearance. Overrides the active theme\'s variables.');
    for (const mode of modes) {
      const v = view(fam, { ...opts, mode });
      const r = v.roles, s = v.syntax;
      out += `.theme-${mode} {
  --background-primary: ${r.bg};
  --background-primary-alt: ${r.surface};
  --background-secondary: ${r.surface};
  --background-secondary-alt: ${r.surface};
  --background-modifier-border: ${r.border};
  --background-modifier-hover: ${r.selection};
  --text-normal: ${r.text};
  --text-muted: ${r.textMuted};
  --text-faint: ${r.textSubtle};
  --text-accent: ${r.link};
  --text-accent-hover: ${r.linkHover};
  --text-selection: ${r.selection};
  --text-highlight-bg: ${r.selection};
  --interactive-accent: ${r.button};
  --interactive-accent-hover: ${r.button};
  --text-on-accent: ${r.onButton};
  --link-color: ${r.link};
  --link-color-hover: ${r.linkHover};
  --link-external-color: ${r.link};
  --h1-color: ${r.text}; --h2-color: ${r.text}; --h3-color: ${r.text};
  --code-background: ${r.surface};
  --code-normal: ${s.variable.hex};
  --code-comment: ${s.comment.hex};
  --code-function: ${s.function.hex};
  --code-important: ${s.decorator.hex};
  --code-keyword: ${s.keyword.hex};
  --code-operator: ${s.operator.hex};
  --code-property: ${s.variable.hex};
  --code-punctuation: ${s.punctuation.hex};
  --code-string: ${s.string.hex};
  --code-tag: ${s.keyword.hex};
  --code-value: ${s.number.hex};
  --blockquote-border-color: ${r.accent};
  --tag-color: ${r.link};
  --tag-background: ${r.surface};
  --checkbox-color: ${r.accent};
  --icon-color: ${r.textMuted};
  --icon-color-hover: ${r.text};
  --titlebar-text-color-focused: ${r.text};
  --divider-color: ${r.border};
  --scrollbar-thumb-bg: ${r.border};
  --scrollbar-active-thumb-bg: ${r.textSubtle};
}
`;
    }
    return [{ name: `${kebab(first.name)}-obsidian.css`, content: out, mime: this.mime }];
  },
};
