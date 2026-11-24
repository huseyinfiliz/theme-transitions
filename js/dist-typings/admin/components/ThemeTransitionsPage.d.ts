import ExtensionPage, { type ExtensionPageAttrs } from 'flarum/admin/components/ExtensionPage';
import type Mithril from 'mithril';
export default class ThemeTransitionsPage extends ExtensionPage {
    private activeTab;
    private originalTheme;
    private copiedCommand;
    private copyTimer;
    oninit(vnode: Mithril.Vnode<ExtensionPageAttrs, this>): void;
    onremove(vnode: Mithril.VnodeDOM<ExtensionPageAttrs, this>): void;
    sections(vnode: Mithril.VnodeDOM<ExtensionPageAttrs, this>): import("flarum/common/utils/ItemList").default<unknown>;
    private changeTab;
    private onTabKeydown;
    private buildDraftConfig;
    private previewTransition;
    private markCommandCopied;
    private copyInstallCommand;
    private renderEffectGroup;
    private renderEffectsTab;
    private renderCustomizationTab;
    private renderSettingsTab;
    private renderIntegrationsTab;
    content(_vnode: Mithril.VnodeDOM<ExtensionPageAttrs, this>): JSX.Element;
}
