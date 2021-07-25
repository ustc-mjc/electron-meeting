const os = require('os')

module.exports = {
    listenIp: '0.0.0.0',
    listenPort: 3333,
    sslCrt: './ssl/cert.pem',
    sslKey: './ssl/key.pem',

    mediasoup: {
        // Worker settings
        numWorkers: Object.keys(os.cpus()).length,
        worker: {
			logLevel : 'warn',
			logTags  :
			[
				'info',
				'ice',
				'dtls',
				'rtp',
				'srtp',
				'rtcp',
				'rtx',
				'bwe',
				'score',
				'simulcast',
				'svc',
				'sctp'
			],
			rtcMinPort : process.env.MEDIASOUP_MIN_PORT || 40000,
			rtcMaxPort : process.env.MEDIASOUP_MAX_PORT || 49999
		},
        // Router settings
        router: {
            mediaCodecs:
                [
                    // https://github.com/haiyangwu/mediasoup-client-android/issues/36#issuecomment-768499443
                    {
						kind: 'audio',
						mimeType: 'audio/PCMU',
						preferredPayloadType: 0,
						clockRate: 8000
					},
					{
						kind: 'audio',
						mimeType: 'audio/PCMA',
						preferredPayloadType: 8,
						clockRate: 8000
					},
                    {
						kind: 'audio',
						mimeType: 'audio/opus',
						clockRate: 48000,
						channels: 2
					},
                    {
                        kind: 'video',
                        mimeType: 'video/VP8',
                        clockRate: 90000,
                        parameters:
                            {
                                'x-google-start-bitrate': 1000
                            }
                    },
                    {
                        kind: 'video',
                        mimeType: 'video/VP9',
                        clockRate: 90000,
                        parameters:
                            {
                                'profile-id': 2,
                                'x-google-start-bitrate': 1000
                            }
                    },
                    {
                        kind: 'video',
                        mimeType: 'video/h264',
                        clockRate: 90000,
                        parameters:
                            {
                                'packetization-mode': 1,
                                'profile-level-id': '4d0032',
                                'level-asymmetry-allowed': 1,
                                'x-google-start-bitrate': 1000
                            }
                    },
                    {
                        kind: 'video',
                        mimeType: 'video/h264',
                        clockRate: 90000,
                        parameters:
                            {
                                'packetization-mode': 1,
                                'profile-level-id': '42e01f',
                                'level-asymmetry-allowed': 1,
                                'x-google-start-bitrate': 1000
                            }
                    }
                ]
        },
        // WebRtcTransport settings
        webRtcTransport: {
            listenIps: [
                {
                    ip: '0.0.0.0',
                    announcedIp: '127.0.0.1' // replace by public IP address
                }
            ],
            minimumAvailableOutgoingBitrate: 600000,
            maxSctpMessageSize: 262144,
            maxIncomingBitrate: 1500000,
            initialAvailableOutgoingBitrate: 1000000
        },
        plainTransportOptions:
            {
                listenIp:
                    {
                        ip: process.env.MEDIASOUP_LISTEN_IP || '1.2.3.4',
                        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP|| '192.168.0.142'
                    },
                maxSctpMessageSize: 262144
            }
    }
};

