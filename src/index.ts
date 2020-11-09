import SpotifyApi from 'spotify-web-api-node'
import { format } from 'date-fns'

const { SPOTIFY_ACCESS_TOKEN } = process.env

const archivePlaylists = async (spotifyAccessToken: string) => {
  const date = format(new Date(), 'yy/MM/dd')
  console.log(`Date is ${date}`)

  const spotify = new SpotifyApi({
    accessToken: spotifyAccessToken
  })

  console.log('Fetching user')
  const user = await spotify.getMe().then(res => res.body)
  console.log(`Fetched user ${user.id}`)

  console.log('Fetching user playlists')
  const playlists = []
  let page = []
  do {
    page = await spotify.getUserPlaylists({ limit: 50, offset: playlists.length }).then(res => res.body.items)
    playlists.push(...page)
    console.log(`Fetched ${page.length} playlists from page`)
  } while (page.length === 50)
  console.log(`Fetched a total of ${playlists.length} playlists`)

  const discoverWeeklyPlaylists = playlists.filter(item => item.name === 'Discover Weekly' && item.owner.id === 'spotify')
  console.log(`Found ${discoverWeeklyPlaylists.length} relevant "Discover Weekly" playlists`)

  await Promise.all(discoverWeeklyPlaylists.map(async (playlist) => {
    console.log(`Archiving playlist ${playlist.id}`)
    const tracks = await spotify.getPlaylistTracks(playlist.id).then(res => res.body.items.map(item => item.track.uri))
    console.log(`Found ${tracks.length} tracks for playlist ${playlist.id}`)

    const playlistName = `Discover Weekly · ${date}`
    const newPlaylist = await spotify.createPlaylist(user.id, playlistName, {public: false, collaborative: false}).then(res => res.body)
    console.log(`Created archive playlist ${newPlaylist.id} · "${playlistName}" for playlist ${playlist.id}`)

    await spotify.addTracksToPlaylist(newPlaylist.id, tracks)
    console.log(`Added ${tracks.length} tracks to archive ${newPlaylist.id}`)
  }))
}

archivePlaylists(SPOTIFY_ACCESS_TOKEN)
