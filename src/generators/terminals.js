// Terminal formats: Ghostty, Alacritty, kitty, WezTerm, tmux, Windows
// Terminal, iTerm2 (.itermcolors plist).
import { view, header, json, kebab, modesOf, rgb01, ANSI_NAMES } from './common.js';

const perMode = (gen) => (fam, opts) => modesOf(opts.mode).map((mode) => gen(view(fam, { ...opts, mode }), mode));

export const ghostty = {
  id: 'ghostty', label: 'Ghostty', group: 'terminals', ext: '', mime: 'text/plain',
  generate: perMode((v, mode) => {
    const t = v.terminal;
    let out = header(v, 'hash', `Copy to ~/.config/ghostty/themes/${kebab(v.name)}-${mode} and set: theme = ${kebab(v.name)}-${mode}`);
    out += `background = ${t.bg}\nforeground = ${t.fg}\ncursor-color = ${t.cursor}\ncursor-text = ${t.cursorText}\n`;
    out += `selection-background = ${t.selectionBg}\nselection-foreground = ${t.selectionFg}\n`;
    t.ansi.forEach((hex, i) => { out += `palette = ${i}=${hex}\n`; });
    return { name: `${kebab(v.name)}-${mode}`, content: out, mime: 'text/plain' };
  }),
};

export const alacritty = {
  id: 'alacritty', label: 'Alacritty', group: 'terminals', ext: 'toml', mime: 'application/toml',
  generate: perMode((v, mode) => {
    const t = v.terminal;
    const q = (h) => `"${h}"`;
    const names = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
    let out = header(v, 'hash', `Add to alacritty.toml: [general] import = ["~/.config/alacritty/${kebab(v.name)}-${mode}.toml"]`);
    out += `[colors.primary]\nbackground = ${q(t.bg)}\nforeground = ${q(t.fg)}\n\n`;
    out += `[colors.cursor]\ntext = ${q(t.cursorText)}\ncursor = ${q(t.cursor)}\n\n`;
    out += `[colors.selection]\ntext = ${q(t.selectionFg)}\nbackground = ${q(t.selectionBg)}\n\n`;
    out += `[colors.normal]\n${names.map((n, i) => `${n} = ${q(t.ansi[i])}`).join('\n')}\n\n`;
    out += `[colors.bright]\n${names.map((n, i) => `${n} = ${q(t.ansi[i + 8])}`).join('\n')}\n`;
    return { name: `${kebab(v.name)}-${mode}.toml`, content: out, mime: 'application/toml' };
  }),
};

export const kitty = {
  id: 'kitty', label: 'kitty', group: 'terminals', ext: 'conf', mime: 'text/plain',
  generate: perMode((v, mode) => {
    const t = v.terminal;
    let out = header(v, 'hash', `Save as ~/.config/kitty/${kebab(v.name)}-${mode}.conf and add: include ${kebab(v.name)}-${mode}.conf`);
    out += `background ${t.bg}\nforeground ${t.fg}\ncursor ${t.cursor}\ncursor_text_color ${t.cursorText}\n`;
    out += `selection_background ${t.selectionBg}\nselection_foreground ${t.selectionFg}\n`;
    out += `url_color ${v.roles.link}\nactive_border_color ${v.roles.accent}\ninactive_border_color ${v.roles.border}\n`;
    out += `active_tab_background ${v.roles.bg}\nactive_tab_foreground ${v.roles.text}\ninactive_tab_background ${v.roles.surface}\ninactive_tab_foreground ${v.roles.textMuted}\n`;
    t.ansi.forEach((hex, i) => { out += `color${i} ${hex}\n`; });
    return { name: `${kebab(v.name)}-${mode}.conf`, content: out, mime: 'text/plain' };
  }),
};

export const wezterm = {
  id: 'wezterm', label: 'WezTerm (Lua)', group: 'terminals', ext: 'lua', mime: 'text/x-lua',
  generate: perMode((v, mode) => {
    const t = v.terminal;
    const q = (h) => `"${h}"`;
    let out = header(v, 'lua', `Save as ~/.config/wezterm/colors/${kebab(v.name)}-${mode}.lua; then: config.color_scheme = "${v.name} ${v.modeLabel}"`);
    out += `return {\n  foreground = ${q(t.fg)},\n  background = ${q(t.bg)},\n  cursor_bg = ${q(t.cursor)},\n  cursor_fg = ${q(t.cursorText)},\n  cursor_border = ${q(t.cursor)},\n`;
    out += `  selection_bg = ${q(t.selectionBg)},\n  selection_fg = ${q(t.selectionFg)},\n  split = ${q(v.roles.border)},\n`;
    out += `  ansi = { ${t.ansi.slice(0, 8).map(q).join(', ')} },\n  brights = { ${t.ansi.slice(8).map(q).join(', ')} },\n`;
    out += `  tab_bar = {\n    background = ${q(v.roles.surface)},\n    active_tab = { bg_color = ${q(v.roles.bg)}, fg_color = ${q(v.roles.text)} },\n    inactive_tab = { bg_color = ${q(v.roles.surface)}, fg_color = ${q(v.roles.textMuted)} },\n    inactive_tab_hover = { bg_color = ${q(v.roles.selection)}, fg_color = ${q(v.roles.text)} },\n    new_tab = { bg_color = ${q(v.roles.surface)}, fg_color = ${q(v.roles.textMuted)} },\n  },\n}\n`;
    return { name: `${kebab(v.name)}-${mode}.lua`, content: out, mime: 'text/x-lua' };
  }),
};

export const tmux = {
  id: 'tmux', label: 'tmux', group: 'terminals', ext: 'conf', mime: 'text/plain',
  generate: perMode((v, mode) => {
    const r = v.roles, t = v.terminal;
    let out = header(v, 'hash', `Add to ~/.tmux.conf: source-file ~/.config/tmux/${kebab(v.name)}-${mode}.conf`);
    out += `set -g status-style "bg=${r.surface},fg=${r.textMuted}"\n`;
    out += `set -g status-left-style "fg=${r.text}"\nset -g status-right-style "fg=${r.textMuted}"\n`;
    out += `set -g window-status-style "fg=${r.textMuted}"\nset -g window-status-current-style "fg=${r.text},bold,underscore"\n`;
    out += `set -g window-status-activity-style "fg=${r.accent}"\n`;
    out += `set -g pane-border-style "fg=${r.border}"\nset -g pane-active-border-style "fg=${r.accent}"\n`;
    out += `set -g message-style "bg=${r.surface},fg=${r.text}"\nset -g message-command-style "bg=${r.surface},fg=${r.text}"\n`;
    out += `set -g mode-style "bg=${r.selection},fg=${r.text}"\nset -g clock-mode-colour "${r.accent}"\n`;
    out += `set -g display-panes-colour "${r.textMuted}"\nset -g display-panes-active-colour "${r.accent}"\n`;
    out += `# Terminal chrome for reference: bg ${t.bg}, fg ${t.fg}\n`;
    return { name: `${kebab(v.name)}-${mode}.conf`, content: out, mime: 'text/plain' };
  }),
};

export const windowsTerminal = {
  id: 'windows-terminal', label: 'Windows Terminal', group: 'terminals', ext: 'json', mime: 'application/json',
  generate: perMode((v, mode) => {
    const t = v.terminal;
    const keys = ['black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white'];
    const scheme = { name: `${v.name} ${v.modeLabel}`, background: t.bg, foreground: t.fg, cursorColor: t.cursor, selectionBackground: t.selectionBg };
    keys.forEach((k, i) => { scheme[k] = t.ansi[i]; });
    keys.forEach((k, i) => { scheme['bright' + k.charAt(0).toUpperCase() + k.slice(1)] = t.ansi[i + 8]; });
    return { name: `${kebab(v.name)}-${mode}.windowsterminal.json`, content: json(scheme), mime: 'application/json' };
  }),
};

export const iterm2 = {
  id: 'iterm2', label: 'iTerm2 (.itermcolors)', group: 'terminals', ext: 'itermcolors', mime: 'application/xml',
  generate: perMode((v, mode) => {
    const t = v.terminal;
    const colour = (key, hex) => {
      const [r, g, b] = rgb01(hex);
      return `\t<key>${key}</key>\n\t<dict>\n\t\t<key>Alpha Component</key>\n\t\t<real>1</real>\n\t\t<key>Blue Component</key>\n\t\t<real>${b.toFixed(6)}</real>\n\t\t<key>Color Space</key>\n\t\t<string>sRGB</string>\n\t\t<key>Green Component</key>\n\t\t<real>${g.toFixed(6)}</real>\n\t\t<key>Red Component</key>\n\t\t<real>${r.toFixed(6)}</real>\n\t</dict>\n`;
    };
    let out = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n`;
    out += header(v, 'xml');
    out += `<plist version="1.0">\n<dict>\n`;
    t.ansi.forEach((hex, i) => { out += colour(`Ansi ${i} Color`, hex); });
    out += colour('Background Color', t.bg);
    out += colour('Foreground Color', t.fg);
    out += colour('Bold Color', t.fg);
    out += colour('Cursor Color', t.cursor);
    out += colour('Cursor Text Color', t.cursorText);
    out += colour('Selection Color', t.selectionBg);
    out += colour('Selected Text Color', t.selectionFg);
    out += colour('Link Color', v.roles.link);
    out += colour('Badge Color', v.roles.accent);
    out += `</dict>\n</plist>\n`;
    return { name: `${kebab(v.name)}-${mode}.itermcolors`, content: out, mime: 'application/xml' };
  }),
};

export { ANSI_NAMES };
