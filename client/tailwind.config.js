const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

const round = (num) => num.toFixed(7).replace(/(\.[0-9]+?)0+$/, '$1').replace(/\.0$/, '');
const em = (px, base) => `${round(px / base)}em`

module.exports = {
	mode: 'jit',
	purge: [
		'./src/*.sss',
		'./src/*.tsx'
	],
	darkMode: true,
	theme: {
		extend: {
			transitionDelay: {
				'0': '0ms'
			},
			fontFamily: {
				sans: [ 'Roboto', ...defaultTheme.fontFamily.sans ]
			},
			spacing: {
				'18': '4.5rem',
			},
			transitionTimingFunction: {
				'bounce': 'cubic-bezier(0, 0.94, 0.38, 1.91)',
			},
			typography: {
				'DEFAULT': {
					css: {
						lineHeight: round(24 / 16),
						p: {
							marginTop: em(9, 16),
							marginBottom: em(9, 16)
						}
					}
				}
			}
		},
		colors: {
			transparent: 'transparent',
			current: 'currentColor',
			white: colors.white,
			black: colors.black,
			gray: {
				50:  '#171D23',
				100: '#1F2630',
				200: '#242D3A',
				300: '#303D4C',
				400: '#596A7D',
				500: '#74879D',
				600: '#879CB3',
				700: '#AABCCF',
				800: '#D0DDEB',
				900: '#EAF0F6'
			},
			blue: colors.blue,
			indigo: colors.indigo
		},
	},
	plugins: [
		require('tailwindcss-interaction-variants'),
		require('@tailwindcss/typography'),
	]
}
