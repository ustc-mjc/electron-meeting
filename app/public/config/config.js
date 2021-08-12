let videoAspectRatio = 1.777
const VIDEO_CONSTRAINS =
{
	'low' :
	{
		width       : { ideal: 320 },
		aspectRatio : videoAspectRatio
	},
	'medium' :
	{
		width       : { ideal: 640 },
		aspectRatio : videoAspectRatio
	},
	'high' :
	{
		width       : { ideal: 1280 },
		aspectRatio : videoAspectRatio
	},
	'veryhigh' :
	{
		width       : { ideal: 1920 },
		aspectRatio : videoAspectRatio
	},
	'ultra' :
	{
		width       : { ideal: 3840 },
		aspectRatio : videoAspectRatio
	}
};

const PC_PROPRIETARY_CONSTRAINTS =
{
	optional : [ { googDscp: true } ]
};

const VIDEO_SIMULCAST_ENCODINGS =
[
	{ scaleResolutionDownBy: 4, maxBitRate: 100000 },
	{ scaleResolutionDownBy: 1, maxBitRate: 1200000 }
];

// Used for VP9 webcam video.
const VIDEO_KSVC_ENCODINGS =
[
	{ scalabilityMode: 'S3T3_KEY' }
];

// Used for VP9 desktop sharing.
const VIDEO_SVC_ENCODINGS =
[
	{ scalabilityMode: 'S3T3', dtx: true }
];

// eslint-disable-next-line
var config =
{
	/**
	 * Supported browsers version 
	 * in bowser satisfy format.
	 * See more:
	 * https://www.npmjs.com/package/bowser#filtering-browsers
	 * Otherwise you got a unsupported browser page
	 */
	supportedBrowsers :
	{
		'windows' : {
			'internet explorer' : '>12',
			'microsoft edge'    : '>18'
		},
		'safari'                       : '>12',
		'firefox'                      : '>=60',
		'chrome'                       : '>=74',
		'chromium'                     : '>=74',
		'opera'                        : '>=62',
		'samsung internet for android' : '>=11.1.1.52'
	},

	/**
	 * Resolutions:
	 * 
	 * low ~ 320x240
	 * medium ~ 640x480
	 * high ~ 1280x720
	 * veryhigh ~ 1920x1080
	 * ultra ~ 3840x2560
	 * 
	 **/

	/**
	 * Frame rates:
	 * 
	 * 1, 5, 10, 15, 20, 25, 30
	 * 
	 **/
	// The aspect ratio of the videos as shown on
	// the screen. This is changeable in client settings.
	// This value must match one of the defined values in
	// viewAspectRatios EXACTLY (e.g. 1.333)
	viewAspectRatio  : 1.777,
	// These are the selectable aspect ratios in the settings
	viewAspectRatios : [ {
		value : 1.333, // 4 / 3
		label : '4 : 3'
	}, {
		value : 1.777, // 16 / 9
		label : '16 : 9'
	} ],
	// The aspect ratio of the video from the camera
	// this is not changeable in settings, only config
	videoAspectRatio              : 1.777,
	defaultResolution             : 'medium',
	defaultFrameRate              : 15,
	defaultScreenResolution       : 'veryhigh',
	defaultScreenSharingFrameRate : 5,
	// Enable or disable simulcast for webcam video
	simulcast                     : true,
	// Enable or disable simulcast for screen sharing video
	simulcastSharing              : false,
	// Simulcast encoding layers and levels
	simulcastEncodings            :
	[
		{ scaleResolutionDownBy: 4 },
		{ scaleResolutionDownBy: 2 },
		{ scaleResolutionDownBy: 1 }
	],

	/**
	 * Alternative simulcast setting:
	 * [
	 *   { maxBitRate: 50000 }, 
	 *	 { maxBitRate: 1000000 },
	 *	 { maxBitRate: 4800000 }
	 *],
	 **/

	/**
	 * White listing browsers that support audio output device selection.
	 * It is not yet fully implemented in Firefox.
	 * See: https://bugzilla.mozilla.org/show_bug.cgi?id=1498512
	 */
	audioOutputSupportedBrowsers :
	[
		'chrome',
		'opera'
	],
	// Socket.io request timeout
	requestTimeout   : 20000,
	requestRetries   : 3,
	transportOptions :
	{
		tcp : true
	},
	// defaults for audio setting on new clients / can be customized and overruled from client side
	defaultAudio:
	{
		autoGainControl      : false, // default : false
		echoCancellation     : true, // default : true 
		noiseSuppression     : true, // default : true 
		voiceActivatedUnmute : false, // default : false / Automatically unmute speaking above noisThereshold
		noiseThreshold       : -60 // default -60 / This is only for voiceActivatedUnmute and audio-indicator
	},
	// Audio options for now only centrally from config file: 
	centralAudioOptions:
	{
		sampleRate          : 96000, // default : 96khz / will not eat that much bandwith thanks to opus
		channelCount        : 1, // default : 1 / usually mics are mono so this saves bandwidth
		volume              : 1.0,  // default : 1.0
		sampleSize          : 16,  // default : 16
		opusStereo          : false, // default : false / usually mics are mono so this saves bandwidth
		opusDtx             : true,  // default : true / will save bandwidth 
		opusFec             : true, // default : true / forward error correction
		opusPtime           : '20', // default : 20 / minimum packet time (3, 5, 10, 20, 40, 60, 120)
		opusMaxPlaybackRate : 96000
	}
};
