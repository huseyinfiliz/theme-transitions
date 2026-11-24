import app from 'flarum/admin/app';
import type { Extension } from 'flarum/admin/AdminApplication';
import ExtensionPage, { type ExtensionPageAttrs } from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import Form from 'flarum/common/components/Form';
import Icon from 'flarum/common/components/Icon';
import LinkButton from 'flarum/common/components/LinkButton';
import Select from 'flarum/common/components/Select';
import Switch from 'flarum/common/components/Switch';
import classList from 'flarum/common/utils/classList';
import extractText from 'flarum/common/utils/extractText';
import type Mithril from 'mithril';
import {
  DIRECTION_MODES,
  EASING_PRESETS,
  EFFECT_CATALOG,
  getEffectMeta,
  isEffectId,
  isValidCustomEasing,
  ORIGIN_MODES,
  REVERSE_MODES,
} from '../../common/transitions/catalog';
import { parseBooleanSetting, parseConfigFromSettingsMap, SETTINGS_PREFIX } from '../../common/transitions/config';
import { runThemeTransitionSyncOrAsync } from '../../common/transitions/engine';
import type { EffectId, TransitionConfig, TransitionPoint } from '../../common/transitions/types';

type PageTab = 'effects' | 'customization' | 'settings' | 'integrations';

const PAGE_TABS: readonly PageTab[] = ['effects', 'customization', 'settings', 'integrations'];
const SIMPLE_DARK_MODE_ID = 'huseyinfiliz-simple-dark-mode';
const SIMPLE_DARK_MODE_COMMAND = 'composer require huseyinfiliz/simple-dark-mode:"*"';

const TAB_ICONS: Record<PageTab, string> = {
  effects: 'fas fa-wand-magic-sparkles',
  customization: 'fas fa-sliders-h',
  settings: 'fas fa-cog',
  integrations: 'fas fa-puzzle-piece',
};

function t(key: string, params?: Record<string, string | number>): string {
  return extractText(app.translator.trans(`huseyinfiliz-theme-transitions.admin.${key}`, params ?? {}));
}

function isExtensionActive(id: string): boolean {
  const raw = app.data.settings.extensions_enabled;
  if (!raw) return false;

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.includes(id);
  } catch {
    return false;
  }
}

function flippedTheme(theme: string): string {
  switch (theme) {
    case 'dark-hc':
      return 'light-hc';
    case 'light-hc':
      return 'dark-hc';
    case 'dark':
      return 'light';
    case 'light':
    default:
      return 'dark';
  }
}

function triggerCenterFromEvent(event: Event): TransitionPoint | null {
  const target = event.currentTarget instanceof Element ? event.currentTarget : null;
  if (!target) return null;

  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 && rect.height <= 0) return null;

  if (event instanceof MouseEvent && event.detail !== 0 && (event.clientX !== 0 || event.clientY !== 0) && (rect.width > 72 || rect.height > 72)) {
    return {
      x: event.clientX,
      y: event.clientY,
    };
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export default class ThemeTransitionsPage extends ExtensionPage {
  private activeTab: PageTab = 'effects';
  private originalTheme = 'light';
  private copiedCommand = false;
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  oninit(vnode: Mithril.Vnode<ExtensionPageAttrs, this>): void {
    super.oninit(vnode);

    this.originalTheme = document.documentElement.getAttribute('data-theme') || 'light';

    // Register all settings up front so dirty tracking and Reset Settings work across all tabs.
    this.setting(`${SETTINGS_PREFIX}enabled`, '1', t('settings.enabled_label'));
    this.setting(`${SETTINGS_PREFIX}effect`, 'circle', t('settings.effect_label'));
    this.setting(`${SETTINGS_PREFIX}duration`, '480', t('settings.duration_label'));
    this.setting(`${SETTINGS_PREFIX}easing`, 'telegram', t('settings.easing_label'));
    this.setting(`${SETTINGS_PREFIX}custom_easing`, EASING_PRESETS.telegram, t('settings.custom_easing_label'));
    this.setting(`${SETTINGS_PREFIX}origin`, 'trigger', t('settings.origin_label'));
    this.setting(`${SETTINGS_PREFIX}direction`, 'left-to-right', t('settings.direction_label'));
    this.setting(`${SETTINGS_PREFIX}reverse_mode`, 'none', t('settings.reverse_mode_label'));
    this.setting(`${SETTINGS_PREFIX}blinds_count`, '8', t('settings.blinds_count_label'));
    this.setting(`${SETTINGS_PREFIX}blur_amount`, '12', t('settings.blur_amount_label'));
    this.setting(`${SETTINGS_PREFIX}enable_admin`, '1', t('settings.enable_admin_label'));
    this.setting(`${SETTINGS_PREFIX}disable_on_mobile`, '0', t('settings.disable_on_mobile_label'));
    this.setting(`${SETTINGS_PREFIX}respect_reduced_motion`, '1', t('settings.respect_reduced_motion_label'));
  }

  onremove(vnode: Mithril.VnodeDOM<ExtensionPageAttrs, this>): void {
    super.onremove(vnode);

    if (this.copyTimer !== null) {
      clearTimeout(this.copyTimer);
      this.copyTimer = null;
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (currentTheme !== this.originalTheme) {
      document.documentElement.setAttribute('data-theme', this.originalTheme);
    }
  }

  sections(vnode: Mithril.VnodeDOM<ExtensionPageAttrs, this>) {
    const items = super.sections(vnode);
    items.remove('permissions');
    return items;
  }

  private changeTab(tab: PageTab, focus = false): void {
    this.activeTab = tab;
    if (focus) {
      this.element.querySelector<HTMLButtonElement>(`#theme-transitions-${tab}-tab`)?.focus();
    }
  }

  private onTabKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const index = PAGE_TABS.indexOf(this.activeTab);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? PAGE_TABS.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + PAGE_TABS.length) % PAGE_TABS.length;

    this.changeTab(PAGE_TABS[next], true);
  }

  private buildDraftConfig(overrideEffect?: EffectId): TransitionConfig {
    const rawMap: Record<string, unknown> = {};

    Object.keys(this.settings).forEach((key) => {
      rawMap[key] = this.settings[key]();
    });

    const config = parseConfigFromSettingsMap(rawMap);
    config.enabled = true;

    if (overrideEffect) {
      config.effect = overrideEffect;
    }

    return config;
  }

  private previewTransition(event: Event, overrideEffect?: EffectId): void {
    const fromTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const toTheme = flippedTheme(fromTheme);
    const config = this.buildDraftConfig(overrideEffect);
    const triggerPoint = triggerCenterFromEvent(event);

    runThemeTransitionSyncOrAsync({
      config,
      triggerPoint,
      fromTheme,
      toTheme,
      applyDomChange: () => {
        document.documentElement.setAttribute('data-theme', toTheme);
        m.redraw();
      },
    });
  }

  private markCommandCopied(): void {
    this.copiedCommand = true;
    if (this.copyTimer !== null) {
      clearTimeout(this.copyTimer);
    }
    this.copyTimer = setTimeout(() => {
      this.copiedCommand = false;
      this.copyTimer = null;
      m.redraw();
    }, 2000);
    m.redraw();
  }

  private copyInstallCommand(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      void navigator.clipboard.writeText(SIMPLE_DARK_MODE_COMMAND).then(
        () => this.markCommandCopied(),
        () => {}
      );
      return;
    }

    const input = document.createElement('input');
    input.value = SIMPLE_DARK_MODE_COMMAND;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      this.markCommandCopied();
    } finally {
      input.remove();
    }
  }

  private renderEffectGroup(category: 'radial' | 'geometric' | 'cinematic', selectedEffect: EffectId): Mithril.Children {
    const effectStream = this.setting(`${SETTINGS_PREFIX}effect`, 'circle');
    const items = EFFECT_CATALOG.filter((item) => item.category === category);

    return (
      <div className="ThemeTransitionsPage-category">
        <h4 className="ThemeTransitionsPage-categoryTitle">{t(`categories.${category}`)}</h4>
        <div className="ThemeTransitionsPage-effectGrid">
          {items.map((item) => {
            const active = item.id === selectedEffect;

            return (
              <div
                key={item.id}
                className={classList('ThemeTransitionsPage-effectCard', active && 'is-active')}
                role="button"
                tabIndex={0}
                aria-pressed={active ? 'true' : 'false'}
                onclick={() => {
                  effectStream(item.id);
                }}
                onkeydown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    effectStream(item.id);
                  }
                }}
              >
                <div className="ThemeTransitionsPage-effectHeader">
                  <span className="ThemeTransitionsPage-effectIcon">
                    <Icon name={item.icon} />
                  </span>
                  <span className="ThemeTransitionsPage-effectName">{t(`effects.${item.id}.name`)}</span>
                  <button
                    type="button"
                    className="Button Button--icon ThemeTransitionsPage-cardPreviewBtn"
                    title={t('preview.card_button', { effect: t(`effects.${item.id}.name`) })}
                    aria-label={t('preview.card_button', { effect: t(`effects.${item.id}.name`) })}
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation();
                      effectStream(item.id);
                      this.previewTransition(e, item.id);
                    }}
                  >
                    <Icon name="fas fa-play" />
                  </button>
                </div>
                <p className="ThemeTransitionsPage-effectDesc">{t(`effects.${item.id}.description`)}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  private renderEffectsTab(selectedEffect: EffectId, draft: TransitionConfig): Mithril.Children {
    const meta = getEffectMeta(selectedEffect);

    return (
      <div className="ThemeTransitionsPage-panel">
        <h3>{t('tabs.effects')}</h3>
        <p className="helpText ThemeTransitionsPage-introduction">{t('tab_descriptions.effects')}</p>

        <div className="ThemeTransitionsPage-info" role="note">
          <Icon name={meta.icon} />
          <div>
            <p>{t('tab_descriptions.effects_info')}</p>
            <div className="ThemeTransitionsPage-draftBadges">
              <span className="ThemeTransitionsPage-badge">{t(`effects.${selectedEffect}.name`)}</span>
              <span className="ThemeTransitionsPage-badge">{`${draft.duration} ms`}</span>
              <span className="ThemeTransitionsPage-badge">{t(`options.easing.${draft.easing}`)}</span>
            </div>
          </div>
        </div>

        {this.renderEffectGroup('radial', selectedEffect)}
        {this.renderEffectGroup('geometric', selectedEffect)}
        {this.renderEffectGroup('cinematic', selectedEffect)}
      </div>
    );
  }

  private renderCustomizationTab(selectedEffect: EffectId, draft: TransitionConfig): Mithril.Children {
    const durationStream = this.setting(`${SETTINGS_PREFIX}duration`, '480');
    const easingStream = this.setting(`${SETTINGS_PREFIX}easing`, 'telegram');
    const customEasingStream = this.setting(`${SETTINGS_PREFIX}custom_easing`, EASING_PRESETS.telegram);
    const originStream = this.setting(`${SETTINGS_PREFIX}origin`, 'trigger');
    const directionStream = this.setting(`${SETTINGS_PREFIX}direction`, 'left-to-right');
    const reverseStream = this.setting(`${SETTINGS_PREFIX}reverse_mode`, 'none');
    const blindsStream = this.setting(`${SETTINGS_PREFIX}blinds_count`, '8');
    const blurStream = this.setting(`${SETTINGS_PREFIX}blur_amount`, '12');

    const meta = getEffectMeta(selectedEffect);
    const customEasingValid = isValidCustomEasing(customEasingStream());

    const easingOptions: Record<string, string> = {};
    (['telegram', 'smooth', 'ease-out', 'ease-in-out', 'spring', 'linear', 'custom'] as const).forEach((key) => {
      easingOptions[key] = t(`options.easing.${key}`);
    });

    const originOptions: Record<string, string> = {};
    ORIGIN_MODES.forEach((key) => {
      originOptions[key] = t(`options.origin.${key}`);
    });

    const directionOptions: Record<string, string> = {};
    DIRECTION_MODES.forEach((key) => {
      directionOptions[key] = t(`options.direction.${key}`);
    });

    const reverseOptions: Record<string, string> = {};
    REVERSE_MODES.forEach((key) => {
      reverseOptions[key] = t(`options.reverse_mode.${key}`);
    });

    const hasEffectSpecificOptions =
      meta.supportsOrigin || meta.supportsDirection || meta.supportsReverse || meta.supportsBlinds || meta.supportsBlur;

    return (
      <div className="ThemeTransitionsPage-panel">
        <h3>{t('tabs.customization')}</h3>
        <p className="helpText ThemeTransitionsPage-introduction">{t('tab_descriptions.customization')}</p>

        <div className="ThemeTransitionsPage-info" role="note">
          <Icon name={meta.icon} />
          <div>
            <p>
              {t('tab_descriptions.customization_info', {
                effect: t(`effects.${selectedEffect}.name`),
                description: t(`effects.${selectedEffect}.description`),
              })}
            </p>
          </div>
        </div>

        <div className="ThemeTransitionsPage-subsection">
          <h4 className="ThemeTransitionsPage-subsectionTitle">{t('sections.timing')}</h4>

          <div className="Form-group">
            <label>{t('settings.duration_label')}</label>
            <div className="helpText">{t('settings.duration_help')}</div>
            <div className="ThemeTransitionsPage-rangeRow">
              <input
                type="range"
                min="100"
                max="2000"
                step="20"
                value={String(draft.duration)}
                oninput={(e: Event) => durationStream((e.target as HTMLInputElement).value)}
              />
              <input
                type="number"
                className="FormControl ThemeTransitionsPage-numberInput"
                min="100"
                max="2000"
                step="20"
                value={String(draft.duration)}
                oninput={(e: Event) => durationStream((e.target as HTMLInputElement).value)}
              />
              <span className="ThemeTransitionsPage-unit">ms</span>
            </div>
          </div>

          <div className="Form-group">
            <label>{t('settings.easing_label')}</label>
            <div className="helpText">{t('settings.easing_help')}</div>
            <Select options={easingOptions} value={draft.easing} onchange={easingStream} />
          </div>

          {draft.easing === 'custom' && (
            <div className="Form-group">
              <label>{t('settings.custom_easing_label')}</label>
              <div className="helpText">{t('settings.custom_easing_help')}</div>
              <div className="ThemeTransitionsPage-customEasingRow">
                <input
                  type="text"
                  className="FormControl"
                  placeholder="cubic-bezier(.33, .35, .28, 1)"
                  value={customEasingStream()}
                  oninput={(e: Event) => customEasingStream((e.target as HTMLInputElement).value)}
                />
                <span className={classList('ThemeTransitionsPage-validity', customEasingValid ? 'is-valid' : 'is-invalid')}>
                  {customEasingValid ? t('validation.valid_easing') : t('validation.invalid_easing')}
                </span>
              </div>
            </div>
          )}
        </div>

        {hasEffectSpecificOptions && (
          <div className="ThemeTransitionsPage-subsection">
            <h4 className="ThemeTransitionsPage-subsectionTitle">{t('sections.effect_options')}</h4>

            {meta.supportsOrigin && (
              <div className="Form-group">
                <label>{t('settings.origin_label')}</label>
                <div className="helpText">{t('settings.origin_help')}</div>
                <Select options={originOptions} value={draft.origin} onchange={originStream} />
              </div>
            )}

            {meta.supportsDirection && (
              <div className="Form-group">
                <label>{t('settings.direction_label')}</label>
                <div className="helpText">{t('settings.direction_help')}</div>
                <Select options={directionOptions} value={draft.direction} onchange={directionStream} />
              </div>
            )}

            {meta.supportsReverse && (
              <div className="Form-group">
                <label>{t('settings.reverse_mode_label')}</label>
                <div className="helpText">{t('settings.reverse_mode_help')}</div>
                <Select options={reverseOptions} value={draft.reverseMode} onchange={reverseStream} />
              </div>
            )}

            {meta.supportsBlinds && (
              <div className="Form-group">
                <label>{t('settings.blinds_count_label')}</label>
                <div className="helpText">{t('settings.blinds_count_help')}</div>
                <div className="ThemeTransitionsPage-rangeRow">
                  <input
                    type="range"
                    min="3"
                    max="24"
                    step="1"
                    value={String(draft.blindsCount)}
                    oninput={(e: Event) => blindsStream((e.target as HTMLInputElement).value)}
                  />
                  <input
                    type="number"
                    className="FormControl ThemeTransitionsPage-numberInput"
                    min="3"
                    max="24"
                    step="1"
                    value={String(draft.blindsCount)}
                    oninput={(e: Event) => blindsStream((e.target as HTMLInputElement).value)}
                  />
                </div>
              </div>
            )}

            {meta.supportsBlur && (
              <div className="Form-group">
                <label>{t('settings.blur_amount_label')}</label>
                <div className="helpText">{t('settings.blur_amount_help')}</div>
                <div className="ThemeTransitionsPage-rangeRow">
                  <input
                    type="range"
                    min="2"
                    max="32"
                    step="1"
                    value={String(draft.blurAmount)}
                    oninput={(e: Event) => blurStream((e.target as HTMLInputElement).value)}
                  />
                  <input
                    type="number"
                    className="FormControl ThemeTransitionsPage-numberInput"
                    min="2"
                    max="32"
                    step="1"
                    value={String(draft.blurAmount)}
                    oninput={(e: Event) => blurStream((e.target as HTMLInputElement).value)}
                  />
                  <span className="ThemeTransitionsPage-unit">px</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  private renderSettingsTab(): Mithril.Children {
    const enabledStream = this.setting(`${SETTINGS_PREFIX}enabled`, '1');
    const enableAdminStream = this.setting(`${SETTINGS_PREFIX}enable_admin`, '1');
    const disableMobileStream = this.setting(`${SETTINGS_PREFIX}disable_on_mobile`, '0');
    const reducedMotionStream = this.setting(`${SETTINGS_PREFIX}respect_reduced_motion`, '1');

    return (
      <div className="ThemeTransitionsPage-panel">
        <h3>{t('tabs.settings')}</h3>
        <p className="helpText ThemeTransitionsPage-introduction">{t('tab_descriptions.settings')}</p>

        <div className="ThemeTransitionsPage-info" role="note">
          <Icon name="fas fa-info-circle" />
          <div>
            <p>{t('tab_descriptions.settings_info')}</p>
          </div>
        </div>

        <div className="ThemeTransitionsPage-toggleGrid">
          <div className="ThemeTransitionsPage-toggleCard">
            <div className="Form-group">
              <Switch state={parseBooleanSetting(enabledStream(), true)} onchange={enabledStream}>
                {t('settings.enabled_label')}
              </Switch>
              <div className="helpText">{t('settings.enabled_help')}</div>
            </div>
          </div>

          <div className="ThemeTransitionsPage-toggleCard">
            <div className="Form-group">
              <Switch state={parseBooleanSetting(enableAdminStream(), true)} onchange={enableAdminStream}>
                {t('settings.enable_admin_label')}
              </Switch>
              <div className="helpText">{t('settings.enable_admin_help')}</div>
            </div>
          </div>

          <div className="ThemeTransitionsPage-toggleCard">
            <div className="Form-group">
              <Switch state={parseBooleanSetting(disableMobileStream(), false)} onchange={disableMobileStream}>
                {t('settings.disable_on_mobile_label')}
              </Switch>
              <div className="helpText">{t('settings.disable_on_mobile_help')}</div>
            </div>
          </div>

          <div className="ThemeTransitionsPage-toggleCard">
            <div className="Form-group">
              <Switch state={parseBooleanSetting(reducedMotionStream(), true)} onchange={reducedMotionStream}>
                {t('settings.respect_reduced_motion_label')}
              </Switch>
              <div className="helpText">{t('settings.respect_reduced_motion_help')}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderIntegrationsTab(): Mithril.Children {
    const simpleDarkMode: Extension | undefined = app.data.extensions[SIMPLE_DARK_MODE_ID];
    const isInstalled = Boolean(simpleDarkMode);
    const isEnabled = isInstalled && isExtensionActive(SIMPLE_DARK_MODE_ID);

    const statusKey = isEnabled ? 'status_active' : isInstalled ? 'status_disabled' : 'status_not_installed';
    const statusClass = isEnabled ? 'is-active' : isInstalled ? 'is-disabled' : 'is-not-installed';
    const noteKey = isEnabled ? 'active_note' : isInstalled ? 'disabled_note' : 'install_note';

    const iconName = simpleDarkMode?.icon?.name || 'fas fa-circle-half-stroke';
    const iconStyle: Record<string, string> = simpleDarkMode?.icon ? simpleDarkMode.icon : { color: '#fff', backgroundColor: '#3498db' };

    return (
      <div className="ThemeTransitionsPage-panel">
        <h3>{t('tabs.integrations')}</h3>
        <p className="helpText ThemeTransitionsPage-introduction">{t('tab_descriptions.integrations')}</p>

        <div className="ThemeTransitionsPage-info" role="note">
          <Icon name="fas fa-info-circle" />
          <div>
            <p>{t('tab_descriptions.integrations_info')}</p>
          </div>
        </div>

        <div className="ThemeTransitionsPage-integrationList">
          <div className="ThemeTransitionsPage-integrationCard">
            <div className="ThemeTransitionsPage-integrationMain">
              <span className="ExtensionIcon ThemeTransitionsPage-integrationIcon" style={iconStyle}>
                <Icon name={iconName} />
              </span>

              <div className="ThemeTransitionsPage-integrationBody">
                <div className="ThemeTransitionsPage-integrationHeader">
                  <div>
                    <h4 className="ThemeTransitionsPage-integrationTitle">{t('integrations.simple_dark_mode.title')}</h4>
                    <div className="ThemeTransitionsPage-integrationMeta">
                      <code>{t('integrations.simple_dark_mode.package')}</code>
                      {simpleDarkMode?.version && <span className="ThemeTransitionsPage-badge">{simpleDarkMode.version}</span>}
                    </div>
                  </div>

                  <span className={classList('ThemeTransitionsPage-statusBadge', statusClass)}>
                    <Icon name={isEnabled ? 'fas fa-check-circle' : isInstalled ? 'fas fa-pause-circle' : 'fas fa-download'} />
                    {t(`integrations.${statusKey}`)}
                  </span>
                </div>

                <p className="ThemeTransitionsPage-integrationDesc">{t('integrations.simple_dark_mode.description')}</p>
                <p className="helpText ThemeTransitionsPage-integrationNote">{t(`integrations.simple_dark_mode.${noteKey}`)}</p>

                {!isInstalled && (
                  <div className="ThemeTransitionsPage-installBox">
                    <code>{SIMPLE_DARK_MODE_COMMAND}</code>
                    <Button
                      className="Button Button--small"
                      icon={this.copiedCommand ? 'fas fa-check' : 'far fa-copy'}
                      onclick={() => this.copyInstallCommand()}
                    >
                      {t(`integrations.simple_dark_mode.${this.copiedCommand ? 'copied_command' : 'copy_command'}`)}
                    </Button>
                  </div>
                )}

                <div className="ThemeTransitionsPage-integrationActions">
                  {isInstalled && (
                    <LinkButton
                      className="Button Button--primary"
                      icon={isEnabled ? 'fas fa-sliders-h' : 'fas fa-power-off'}
                      href={app.route('extension', { id: SIMPLE_DARK_MODE_ID })}
                    >
                      {t(`integrations.simple_dark_mode.${isEnabled ? 'open_settings' : 'open_extension'}`)}
                    </LinkButton>
                  )}

                  <a className="Button" href="https://github.com/huseyinfiliz/simple-dark-mode" target="_blank" rel="noopener noreferrer">
                    <Icon name="fab fa-github" />
                    {t('integrations.simple_dark_mode.github')}
                  </a>

                  <a className="Button" href="https://discuss.flarum.org/d/39530-simple-dark-mode-flarum-2" target="_blank" rel="noopener noreferrer">
                    <Icon name="fas fa-comment-alt" />
                    {t('integrations.simple_dark_mode.discuss')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  content(_vnode: Mithril.VnodeDOM<ExtensionPageAttrs, this>) {
    const effectStream = this.setting(`${SETTINGS_PREFIX}effect`, 'circle');
    const rawEffect = effectStream();
    const selectedEffect: EffectId = isEffectId(rawEffect) ? rawEffect : 'circle';
    const draft = this.buildDraftConfig();

    return (
      <div className="ThemeTransitionsPage">
        <Form className="ThemeTransitionsPage-form">
          <div className="ThemeTransitionsPage-header">
            <div className="ThemeTransitionsPage-tabs" role="tablist" aria-label={t('navigation')}>
              {PAGE_TABS.map((tab) => (
                <Button
                  key={tab}
                  id={`theme-transitions-${tab}-tab`}
                  role="tab"
                  aria-controls={`theme-transitions-${tab}-panel`}
                  aria-selected={this.activeTab === tab ? 'true' : 'false'}
                  tabIndex={this.activeTab === tab ? 0 : -1}
                  className={classList('Button', this.activeTab === tab && 'active')}
                  onclick={() => this.changeTab(tab)}
                  onkeydown={(e: KeyboardEvent) => this.onTabKeydown(e)}
                >
                  <Icon name={TAB_ICONS[tab]} />
                  {t(`tabs.${tab}`)}
                </Button>
              ))}
            </div>

            <div className="ThemeTransitionsPage-actions">
              <Button className="Button Button--primary" icon="fas fa-play" onclick={(e: MouseEvent) => this.previewTransition(e)}>
                {t('preview.button')}
              </Button>
            </div>
          </div>

          <div
            className="ThemeTransitionsPage-content"
            role="tabpanel"
            id={`theme-transitions-${this.activeTab}-panel`}
            aria-labelledby={`theme-transitions-${this.activeTab}-tab`}
          >
            {this.activeTab === 'effects'
              ? this.renderEffectsTab(selectedEffect, draft)
              : this.activeTab === 'customization'
                ? this.renderCustomizationTab(selectedEffect, draft)
                : this.activeTab === 'settings'
                  ? this.renderSettingsTab()
                  : this.renderIntegrationsTab()}
          </div>

          <div className="ThemeTransitionsPage-saveControls">
            {this.submitButton()}
            {this.resetButton(
              undefined,
              app.translator.trans(
                'core.admin.extension.reset_settings.title_extension',
                {
                  extensionTitle: this.extension.extra['flarum-extension'].title,
                },
                true
              ),
              this.extension.id
            )}
          </div>
        </Form>
      </div>
    );
  }
}
