import app from 'flarum/admin/app';
import Button from 'flarum/common/components/Button';
import ExtensionPage, { type ExtensionPageAttrs } from 'flarum/admin/components/ExtensionPage';
import Form from 'flarum/common/components/Form';
import Icon from 'flarum/common/components/Icon';
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

function t(key: string, params?: Record<string, string | number>): string {
  return extractText(app.translator.trans(`huseyinfiliz-theme-transitions.admin.${key}`, params ?? {}));
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
  private originalTheme = 'light';

  oninit(vnode: Mithril.Vnode<ExtensionPageAttrs, this>): void {
    super.oninit(vnode);

    this.originalTheme = document.documentElement.getAttribute('data-theme') || 'light';

    // Register all settings up front so dirty tracking and Reset Settings cover every field.
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

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (currentTheme !== this.originalTheme) {
      document.documentElement.setAttribute('data-theme', this.originalTheme);
    }
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

  private restoreTheme(): void {
    document.documentElement.setAttribute('data-theme', this.originalTheme);
    m.redraw();
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

  content(_vnode: Mithril.VnodeDOM<ExtensionPageAttrs, this>) {
    const enabledStream = this.setting(`${SETTINGS_PREFIX}enabled`, '1');
    const effectStream = this.setting(`${SETTINGS_PREFIX}effect`, 'circle');
    const durationStream = this.setting(`${SETTINGS_PREFIX}duration`, '480');
    const easingStream = this.setting(`${SETTINGS_PREFIX}easing`, 'telegram');
    const customEasingStream = this.setting(`${SETTINGS_PREFIX}custom_easing`, EASING_PRESETS.telegram);
    const originStream = this.setting(`${SETTINGS_PREFIX}origin`, 'trigger');
    const directionStream = this.setting(`${SETTINGS_PREFIX}direction`, 'left-to-right');
    const reverseStream = this.setting(`${SETTINGS_PREFIX}reverse_mode`, 'none');
    const blindsStream = this.setting(`${SETTINGS_PREFIX}blinds_count`, '8');
    const blurStream = this.setting(`${SETTINGS_PREFIX}blur_amount`, '12');
    const enableAdminStream = this.setting(`${SETTINGS_PREFIX}enable_admin`, '1');
    const disableMobileStream = this.setting(`${SETTINGS_PREFIX}disable_on_mobile`, '0');
    const reducedMotionStream = this.setting(`${SETTINGS_PREFIX}respect_reduced_motion`, '1');

    const rawEffect = effectStream();
    const selectedEffect: EffectId = isEffectId(rawEffect) ? rawEffect : 'circle';
    const meta = getEffectMeta(selectedEffect);
    const draft = this.buildDraftConfig();
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const isPreviewFlipped = currentTheme !== this.originalTheme;

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

    const customEasingValid = isValidCustomEasing(customEasingStream());

    return (
      <div className="ExtensionPage-settings ThemeTransitionsPage">
        <div className="container">
          <div className="ThemeTransitionsPage-previewCard">
            <div className="ThemeTransitionsPage-previewInfo">
              <div className="ThemeTransitionsPage-previewTitle">
                <Icon name={meta.icon} />
                <span>{t('preview.title')}</span>
              </div>
              <div className="ThemeTransitionsPage-previewMeta">
                <span className="ThemeTransitionsPage-badge">{t(`effects.${selectedEffect}.name`)}</span>
                <span className="ThemeTransitionsPage-badge">{`${draft.duration} ms`}</span>
                <span className="ThemeTransitionsPage-badge">{t(`options.easing.${draft.easing}`)}</span>
              </div>
              <p className="helpText">{t('preview.help')}</p>
            </div>
            <div className="ThemeTransitionsPage-previewActions">
              <Button className="Button Button--primary" icon="fas fa-play" onclick={(e: MouseEvent) => this.previewTransition(e)}>
                {t('preview.button')}
              </Button>
              {isPreviewFlipped && (
                <Button className="Button" icon="fas fa-undo" onclick={() => this.restoreTheme()}>
                  {t('preview.restore')}
                </Button>
              )}
            </div>
          </div>

          <Form className="ThemeTransitionsPage-form">
            <div className="Form-group ThemeTransitionsPage-section">
              <Switch state={parseBooleanSetting(enabledStream(), true)} onchange={enabledStream}>
                {t('settings.enabled_label')}
              </Switch>
              <div className="helpText">{t('settings.enabled_help')}</div>
            </div>

            <div className="Form-group ThemeTransitionsPage-section">
              <label>{t('settings.effect_label')}</label>
              <div className="helpText">{t('settings.effect_help')}</div>
              {this.renderEffectGroup('radial', selectedEffect)}
              {this.renderEffectGroup('geometric', selectedEffect)}
              {this.renderEffectGroup('cinematic', selectedEffect)}
            </div>

            <div className="ThemeTransitionsPage-section">
              <h3 className="ThemeTransitionsPage-sectionTitle">{t('sections.timing')}</h3>

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

            <div className="ThemeTransitionsPage-section">
              <h3 className="ThemeTransitionsPage-sectionTitle">{t('sections.effect_options')}</h3>

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

            <div className="ThemeTransitionsPage-section">
              <h3 className="ThemeTransitionsPage-sectionTitle">{t('sections.behavior')}</h3>

              <div className="Form-group">
                <Switch state={parseBooleanSetting(enableAdminStream(), true)} onchange={enableAdminStream}>
                  {t('settings.enable_admin_label')}
                </Switch>
                <div className="helpText">{t('settings.enable_admin_help')}</div>
              </div>

              <div className="Form-group">
                <Switch state={parseBooleanSetting(disableMobileStream(), false)} onchange={disableMobileStream}>
                  {t('settings.disable_on_mobile_label')}
                </Switch>
                <div className="helpText">{t('settings.disable_on_mobile_help')}</div>
              </div>

              <div className="Form-group">
                <Switch state={parseBooleanSetting(reducedMotionStream(), true)} onchange={reducedMotionStream}>
                  {t('settings.respect_reduced_motion_label')}
                </Switch>
                <div className="helpText">{t('settings.respect_reduced_motion_help')}</div>
              </div>
            </div>

            <div className="Form-group Form-controls">
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
      </div>
    );
  }
}
