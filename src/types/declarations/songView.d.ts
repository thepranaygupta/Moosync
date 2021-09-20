/* 
 *  songView.d.ts is a part of Moosync.
 *  
 *  Copyright 2021 by Sahil Gupte <sahilsachingupte@gmail.com>. All rights reserved.
 *  Licensed under the GNU General Public License. 
 *  
 *  See LICENSE in the project root for license information.
 */

interface SongDetailDefaults {
  defaultTitle?: string
  defaultSubtitle?: any
  defaultCover?: string
  defaultSubSubtitle?: string
}

interface SongDetailButtons {
  enableContainer: boolean
  enableLibraryStore: boolean
}

type TableFields = 'index' | 'title' | 'album_name' | 'artist_name'