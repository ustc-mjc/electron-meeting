import React, { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import {RootState} from "../app/store";
import {useDispatch, useSelector} from "react-redux";
import { shareFile } from "../slices/meeting";
import { getCurTime } from "../utils/getCurTime";
import Webtorrent from "../utils/webtorrent";
import { show } from "../slices/toast";
import prettyBytes from "pretty-bytes";

const getMeetingSelf = (state: RootState) => state.meeting.self;
const getMeetingId = (state: RootState) => state.meeting.id;

const DragDrop = ({webtorrent}: {webtorrent: Webtorrent}) => {
  const self = useSelector(getMeetingSelf);
  const meetingId = useSelector(getMeetingId);
  const dispatch = useDispatch();
  const [file, setFile] = useState<File>();
  const handleChange = (file: File) => {
    setFile(file);
    const torrent = webtorrent.createTorrent(file);
    // 存在 torrent 不用seed, 直接dispatch
    const existingTorrent = webtorrent.getClient().get(torrent);
    if (existingTorrent) {
      console.log('share file, existingTorrent');
      dispatch(shareFile({
        meetingId: meetingId,
        name: self.name,
        time: getCurTime(),
        fileName: file.name,
        fileSize: prettyBytes(file.size),
        magnetUri: existingTorrent.magnetURI
      }))
    } else {
      //{ announceList: [ [ webtorrent.getTracker() ] ] }
      dispatch(show('Sharing a file'));
      webtorrent.getClient().seed(file, (newTorrent: any) => {
        console.log('share file, not existingTorrent');
        dispatch(shareFile({
          meetingId: meetingId,
          name: self.name,
          time: getCurTime(),
          fileName: file.name,
          fileSize: prettyBytes(file.size),
          magnetUri: newTorrent.magnetURI
        }))
      })
    }
  };
  
  return (
    <FileUploader 
        handleChange={handleChange} 
        name="file" 
    />
  );
}

export default DragDrop;