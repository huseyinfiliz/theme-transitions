import ExtensionPage, { type ExtensionPageAttrs } from 'flarum/admin/components/ExtensionPage';
import type Mithril from 'mithril';
export default class ThemeTransitionsPage extends ExtensionPage {
    private originalTheme;
    oninit(vnode: Mithril.Vnode<ExtensionPageAttrs, this>): void;
    onremove(vnode: Mithril.VnodeDOM<ExtensionPageAttrs, this>): void;
    private buildDraftConfig;
    private previewTransition;
    private restoreTheme;
    private renderEffectGroup;
    content(_vnode: Mithril.VnodeDOM<ExtensionPageAttrs, this>): JSX.Element;
}
