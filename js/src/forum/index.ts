import app from 'flarum/forum/app';
import { installThemeTransitions } from '../common/transitions/install';

export { default as extend } from './extend';

app.initializers.add('huseyinfiliz-theme-transitions', () => {
  installThemeTransitions('forum');
});
