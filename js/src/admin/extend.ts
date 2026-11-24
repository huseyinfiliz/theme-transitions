import app from 'flarum/admin/app';
import Extend from 'flarum/common/extenders';
import commonExtend from '../common/extend';
import ThemeTransitionsPage from './components/ThemeTransitionsPage';

export default [
  ...commonExtend,

  new Extend.Admin().page(ThemeTransitionsPage).generalIndexItems('settings', () => [
    {
      id: 'theme-transitions-enabled',
      label: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.enabled_label', {}, true),
      help: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.enabled_help', {}, true),
    },
    {
      id: 'theme-transitions-effect',
      label: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.effect_label', {}, true),
      help: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.effect_help', {}, true),
    },
    {
      id: 'theme-transitions-duration',
      label: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.duration_label', {}, true),
      help: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.duration_help', {}, true),
    },
    {
      id: 'theme-transitions-easing',
      label: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.easing_label', {}, true),
      help: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.easing_help', {}, true),
    },
    {
      id: 'theme-transitions-origin',
      label: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.origin_label', {}, true),
      help: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.origin_help', {}, true),
    },
    {
      id: 'theme-transitions-direction',
      label: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.direction_label', {}, true),
      help: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.direction_help', {}, true),
    },
    {
      id: 'theme-transitions-reverse-mode',
      label: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.reverse_mode_label', {}, true),
      help: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.reverse_mode_help', {}, true),
    },
    {
      id: 'theme-transitions-enable-admin',
      label: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.enable_admin_label', {}, true),
      help: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.enable_admin_help', {}, true),
    },
    {
      id: 'theme-transitions-disable-on-mobile',
      label: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.disable_on_mobile_label', {}, true),
      help: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.disable_on_mobile_help', {}, true),
    },
    {
      id: 'theme-transitions-respect-reduced-motion',
      label: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.respect_reduced_motion_label', {}, true),
      help: app.translator.trans('huseyinfiliz-theme-transitions.admin.settings.respect_reduced_motion_help', {}, true),
    },
  ]),
];
