<?php

/*
 * This file is part of huseyinfiliz/theme-transitions.
 *
 * Copyright (c) 2026 Hüseyin Filiz.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace HuseyinFiliz\ThemeTransitions;

use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),

    (new Extend\Frontend('common'))
        ->jsDirectory(__DIR__.'/js/dist/common'),

    new Extend\Locales(__DIR__.'/locale'),

    (new Extend\Settings())
        ->default('huseyinfiliz-theme-transitions.enabled', true)
        ->default('huseyinfiliz-theme-transitions.effect', 'circle')
        ->default('huseyinfiliz-theme-transitions.duration', 480)
        ->default('huseyinfiliz-theme-transitions.easing', 'telegram')
        ->default('huseyinfiliz-theme-transitions.custom_easing', 'cubic-bezier(.33, .35, .28, 1)')
        ->default('huseyinfiliz-theme-transitions.origin', 'trigger')
        ->default('huseyinfiliz-theme-transitions.direction', 'left-to-right')
        ->default('huseyinfiliz-theme-transitions.reverse_mode', 'none')
        ->default('huseyinfiliz-theme-transitions.blinds_count', 8)
        ->default('huseyinfiliz-theme-transitions.blur_amount', 12)
        ->default('huseyinfiliz-theme-transitions.enable_admin', true)
        ->default('huseyinfiliz-theme-transitions.disable_on_mobile', false)
        ->default('huseyinfiliz-theme-transitions.respect_reduced_motion', true)
        ->serializeToForum('themeTransitionsEnabled', 'huseyinfiliz-theme-transitions.enabled', 'boolval')
        ->serializeToForum('themeTransitionsEffect', 'huseyinfiliz-theme-transitions.effect')
        ->serializeToForum('themeTransitionsDuration', 'huseyinfiliz-theme-transitions.duration', 'intval')
        ->serializeToForum('themeTransitionsEasing', 'huseyinfiliz-theme-transitions.easing')
        ->serializeToForum('themeTransitionsCustomEasing', 'huseyinfiliz-theme-transitions.custom_easing')
        ->serializeToForum('themeTransitionsOrigin', 'huseyinfiliz-theme-transitions.origin')
        ->serializeToForum('themeTransitionsDirection', 'huseyinfiliz-theme-transitions.direction')
        ->serializeToForum('themeTransitionsReverseMode', 'huseyinfiliz-theme-transitions.reverse_mode')
        ->serializeToForum('themeTransitionsBlindsCount', 'huseyinfiliz-theme-transitions.blinds_count', 'intval')
        ->serializeToForum('themeTransitionsBlurAmount', 'huseyinfiliz-theme-transitions.blur_amount', 'intval')
        ->serializeToForum('themeTransitionsEnableAdmin', 'huseyinfiliz-theme-transitions.enable_admin', 'boolval')
        ->serializeToForum('themeTransitionsDisableOnMobile', 'huseyinfiliz-theme-transitions.disable_on_mobile', 'boolval')
        ->serializeToForum('themeTransitionsRespectReducedMotion', 'huseyinfiliz-theme-transitions.respect_reduced_motion', 'boolval'),
];
