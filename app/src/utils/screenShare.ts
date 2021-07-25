import isElectron from 'is-electron';

let electron: any = null;

/** 
 * Check if window.require function exits
 * because electron default is "nodeIntegration: false"
 * and this case window.require is not a function.
 * It caused issue with Rocket Chat electron client.
 * 
 * TODO: do it more inteligently.
 */
if (isElectron() && typeof window.require === 'function') {
	electron = window.require('electron');
}

interface Constrains {
    audio: boolean;
    video: any;
}

class ElectronScreenShare {
    _stream: MediaStream| null|undefined;

	constructor()
	{
		this._stream = null;
	}

	// navigator.webkitGetUserMedia 时创建一个约束对象，如果使用 desktopCapturer 的资源，
	// 必须设置 chromeMediaSource 为 "desktop" ，并且 audio 为 false.

	// 如果你想捕获整个桌面的 audio 和 video，你可以设置 chromeMediaSource 为 "screen" ，和 audio
	// 为 true. 当使用这个的时候，不可以指定一个 chromeMediaSourceId.

	start()
	{
		return Promise.resolve()
			.then(() =>
			{
				return electron.desktopCapturer.getSources({ types: [ 'window', 'screen' ], fetchWindowIcons: true});
			})
			.then((sources) =>
			{
				for (const source of sources)
				{
					// console.log(source);
					// Currently only getting whole screen
					if ((source.id as string).startsWith('screen'))
					{
                        const constrains: Constrains = {
                            audio : false,
							video :
							{
								mandatory:
								{
									chromeMediaSource   : 'screen'
								}
							}
                        }
						return navigator.mediaDevices.getUserMedia(constrains);
					}
				}
			})
			.then((stream) =>
			{
				this._stream = stream;

				return stream;
			});
	}

	stop()
	{
		if (this._stream instanceof MediaStream === false)
		{
			return;
		}

		this._stream?.getTracks().forEach((track) => track.stop());
		this._stream = null;
	}

	isScreenShareAvailable()
	{
		return true;
	}
}

class DisplayMediaScreenShare
{
    _stream: MediaStream|null;
	constructor()
	{
		this._stream = null;
	}

	start(options = {})
	{
		const constraints = this._toConstraints(options);
    // @ts-ignore
		return navigator.mediaDevices.getDisplayMedia(constraints)
			.then((stream: any) =>
			{
				this._stream = stream;

				return Promise.resolve(stream);
			});
	}

	stop()
	{
		if (this._stream instanceof MediaStream === false)
		{
			return;
		}

		this._stream?.getTracks().forEach((track) => track.stop());
		this._stream = null;
	}

	isScreenShareAvailable()
	{
		return true;
	}

	_toConstraints(options: any)
	{

		const constraints: Constrains = {
			video : {},
			audio : true
		};

		if (isFinite(options.width))
		{
			constraints.video.width = options.width;
		}
		if (isFinite(options.height))
		{
			constraints.video.height = options.height;
		}
		if (isFinite(options.frameRate))
		{
			constraints.video.frameRate = options.frameRate;
		}

		return constraints;
	}
}

class FirefoxScreenShare
{
    _stream: MediaStream|null|undefined;

	constructor()
	{
		this._stream = null;
	}

	start(options = {})
	{
		const constraints: Constrains = this._toConstraints(options);

		return navigator.mediaDevices.getUserMedia(constraints)
			.then((stream) =>
			{
				this._stream = stream;

				return Promise.resolve(stream);
			});
	}

	stop()
	{
		if (this._stream instanceof MediaStream === false)
		{
			return;
		}

		this._stream?.getTracks().forEach((track) => track.stop());
		this._stream = null;
	}

	isScreenShareAvailable()
	{
		return true;
	}

	_toConstraints(options: any)
	{
		const constraints: Constrains = {
			video : {
				mediaSource : 'window'
			},
			audio : false
		};

		if ('mediaSource' in options)
		{
			constraints.video.mediaSource = options.mediaSource;
		}
		if (isFinite(options.width))
		{
			constraints.video.width = {
				min : options.width,
				max : options.width
			};
		}
		if (isFinite(options.height))
		{
			constraints.video.height = {
				min : options.height,
				max : options.height
			};
		}
		if (isFinite(options.frameRate))
		{
			constraints.video.frameRate = {
				min : options.frameRate,
				max : options.frameRate
			};
		}

		return constraints;
	}
}

class DefaultScreenShare
{
	isScreenShareAvailable()
	{
		return false;
	}
}

export default class ScreenShare
{
	static create(device: any)
	{
		if (electron)
			return new ElectronScreenShare();
		else if (device.platform !== 'desktop')
			return new DefaultScreenShare();
		else
		{
			switch (device.flag)
			{
				case 'firefox':
				{
					if (device.version < 66.0)
						return new FirefoxScreenShare();
					else
						return new DisplayMediaScreenShare();
				}
				case 'safari':
				{
					if (device.version >= 13.0)
						return new DisplayMediaScreenShare();
					else
						return new DefaultScreenShare();
				}
				case 'chrome':
				case 'chromium':
				case 'opera':
				case 'edge':
				{
					return new DisplayMediaScreenShare();
				}
				default:
				{
					return new DefaultScreenShare();
				}
			}
		}
	}
}
