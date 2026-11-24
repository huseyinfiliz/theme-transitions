import app from 'flarum/admin/app';
import { installThemeTransitions } from '../common/transitions/install';

export { default as extend } from './extend';

app.initializers.add('huseyinfiliz-theme-transitions', () => {
  installThemeTransitions('admin');
});
