import WebTorrent from "webtorrent";
import path from "path";
import createTorrent from "create-torrent"
const get = require('simple-get');

export default class Webtorrent {
    _webtorrent;
    _torrentSupport: any = WebTorrent.WEBRTC_SUPPORT;
    _rtcConfig: any;
    _tracker = 'wss://tracker.lab.vvc.niif.hu:443';
    
    constructor() {
        this._rtcConfig = this.getRtcConfig();
        this._webtorrent = new WebTorrent({
            tracker: {
                rtcConfig: {
                    ...this._rtcConfig
                }
            }
        });
    
        this._webtorrent.on('error', (error: any) => {
            console.log(error);
        });
    }
    getClient() {
        return this._webtorrent;
    }
    getTracker() {
        return this._tracker;
    }
    createTorrent(files: any) {
        let result: any = null;
        createTorrent(files, (err, torrent)=>{
            if(err) {
                console.log(err);
                return;
            }
            result = torrent;
        })
        return result;
    }
    getRtcConfig() {
        get.concat({
            url: process.env.GET_RTC_CONFIG || "http://127.0.0.1:3333/__rtcConfig__",
            timeout: 5000
          }, function (err: any, res: any, data: any) {
            if (err || res.statusCode !== 200) {
                console.log(err);
                throw(new Error('Could not get WebRTC config from server. Using default (without TURN).'))
            } else {
              try {
                data = JSON.parse(data)
              } catch (err) {
                throw(new Error('Got invalid WebRTC config from server: ' + data))
              }
              return data.rtcConfig;
            }
        }) 
    }
    // onFiles(files: any) {
    //     console.log('got files:')
    //     files.forEach(function (file: any) {
    //       console.log(' - %s (%s bytes)', file.name, file.size)
    //     })
      
    //     // .torrent file = start downloading the torrent
    //     files.filter(this.isTorrentFile).forEach(this.downloadTorrentFile)
      
    //     // everything else = seed these files
    //     this.seed(files.filter(!this.isTorrentFile))
    // }
    
    // isTorrentFile(file: any) {
    //     const extname = path.extname(file.name).toLowerCase()
    //     return extname === '.torrent'
    //   }
      
    // downloadTorrent(torrentId: any) {
    //     console.log('Downloading torrent from ' + torrentId)
    //     this._webtorrent.add(torrentId, this.onTorrent) 
        
    //   }
      
    // downloadTorrentFile (file: any) {
    //     this._webtorrent.add(file, this.onTorrent)
       
    // }
    // seed(files: any) {
    //     if (files.length === 0) return
    //     console.log('Seeding ' + files.length + ' files')
      
    //     // Seed from WebTorrent
    //     this._webtorrent.seed(files, this.onTorrent)
    //   }
    onTorrent(torrent: WebTorrent.Torrent) {
        torrent.on('warning', (warn: any) => {console.log(warn);});
        torrent.on('error', (err: any) => {console.log(err);});
        const torrentFileName = path.basename(torrent.name, path.extname(torrent.name)) + '.torrent';
      
        console.log('"' + torrentFileName + '" contains ' + torrent.files.length + ' files:');
        console.log('Torrent info hash: ' + torrent.infoHash);
        console.log('Torrent magnetURI: ' + torrent.magnetURI);
        console.log('Torrent torrentFileBlobURL: ' + torrent.torrentFileBlobURL);
        console.log('Torrent files: ' + torrent.files);
        

    }  
}