<?php

/*
 * This file is part of huseyinfiliz/theme-transitions.
 *
 * Copyright (c) 2026 Hüseyin Filiz.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace HuseyinFiliz\ThemeTransitions\Tests\integration;

use Flarum\Testing\integration\TestCase;
use PHPUnit\Framework\Attributes\Test;

class ThemeTransitionsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->extension('huseyinfiliz-theme-transitions');
    }

    #[Test]
    public function forum_attributes_match_defaults(): void
    {
        $response = $this->send(
            $this->request('GET', '/api')
        );

        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode($response->getBody()->getContents(), true);
        $attributes = $body['data']['attributes'];

        $this->assertTrue($attributes['themeTransitionsEnabled']);
        $this->assertSame('circle', $attributes['themeTransitionsEffect']);
        $this->assertSame(480, $attributes['themeTransitionsDuration']);
        $this->assertSame('telegram', $attributes['themeTransitionsEasing']);
        $this->assertSame('cubic-bezier(.33, .35, .28, 1)', $attributes['themeTransitionsCustomEasing']);
        $this->assertSame('trigger', $attributes['themeTransitionsOrigin']);
        $this->assertSame('left-to-right', $attributes['themeTransitionsDirection']);
        $this->assertSame('none', $attributes['themeTransitionsReverseMode']);
        $this->assertSame(8, $attributes['themeTransitionsBlindsCount']);
        $this->assertSame(12, $attributes['themeTransitionsBlurAmount']);
        $this->assertTrue($attributes['themeTransitionsEnableAdmin']);
        $this->assertFalse($attributes['themeTransitionsDisableOnMobile']);
        $this->assertTrue($attributes['themeTransitionsRespectReducedMotion']);
    }

    #[Test]
    public function forum_attributes_reflect_changed_settings(): void
    {
        $this->setting('huseyinfiliz-theme-transitions.enabled', false);
        $this->setting('huseyinfiliz-theme-transitions.effect', 'blinds');
        $this->setting('huseyinfiliz-theme-transitions.duration', 720);
        $this->setting('huseyinfiliz-theme-transitions.easing', 'spring');
        $this->setting('huseyinfiliz-theme-transitions.blinds_count', 14);
        $this->setting('huseyinfiliz-theme-transitions.disable_on_mobile', true);

        $response = $this->send(
            $this->request('GET', '/api')
        );

        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode($response->getBody()->getContents(), true);
        $attributes = $body['data']['attributes'];

        $this->assertFalse($attributes['themeTransitionsEnabled']);
        $this->assertSame('blinds', $attributes['themeTransitionsEffect']);
        $this->assertSame(720, $attributes['themeTransitionsDuration']);
        $this->assertSame('spring', $attributes['themeTransitionsEasing']);
        $this->assertSame(14, $attributes['themeTransitionsBlindsCount']);
        $this->assertTrue($attributes['themeTransitionsDisableOnMobile']);
    }
}
