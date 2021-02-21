import { IpcMainEvent, ipcMain } from 'electron'

import { AlbumsChannel } from './albums'
import { ArtistsChannel } from './artists'
import { PlaylistsChannel } from './playlists'
import { ScannerChannel } from './scanner'
import { SongsChannel } from './songs'

export function registerIpcChannels() {
  const ipcChannels = [
    new SongsChannel(),
    new AlbumsChannel(),
    new ScannerChannel(),
    new PlaylistsChannel(),
    new ArtistsChannel(),
  ]
  ipcChannels.forEach((channel) => ipcMain.on(channel.name, (event, request) => channel.handle(event, request)))
}

export interface IpcRequest {
  type: string
  responseChannel?: string
  params?: any
}

export interface IpcChannelInterface {
  name: string
  handle(event: IpcMainEvent, request: IpcRequest): void
}