  /* globals mejs, MediaElementPlayer */
(function () {
  function createElement (tagName, props) {
    const el = document.createElement(tagName)
    setNodeAttributes(el, props)
    return el
  }

  function setNodeAttributes (target, props) {
    if (target.forEach) {
      return target.forEach(node => {
        setNodeAttributes(node, props)
      })
    }
    for (let key in props) {
      if (key.startsWith('style.')){
        key = key.split('.')[0]
        target.style[key] = props[key]
      }else{
        target.setAttribute(key, props[key])
      }
    }
  }

  const toggleDisplay = (el, shown) => {
    const display = el.getAttribute('display') || 'block'
    const isShown = shown || display === 'none'
    if (isShown) {
      el.setAttribute('data-toggle-prev-display', display)
      el.style.display = 'none'
    } else {
      el.style.display = el.getAttribute('data-toggle-prev-display') || 'block'
    }
  }

  const toggleFade = (el, isShown) => {
    if (window.GSAPTween) { return window.GSAPTween.to(el, {opacity: isShown ? 1 : 0}) }
    toggleDisplay(el, isShown)
  }

  Object.assign(mejs.MepDefaults, {
    loopText: mejs.i18n.t('Repeat On/Off'),
    shuffleText: mejs.i18n.t('Shuffle On/Off'),
    nextText: mejs.i18n.t('Next Track'),
    prevText: mejs.i18n.t('Previous Track'),
    playlistText: mejs.i18n.t('Show/Hide Playlist')
  })

  Object.assign(MediaElementPlayer.prototype, {
    // LOOP TOGGLE
    buildloop (player, controls, layers, media) {
      const t = this
      const loop = createElement('div', {
        class: `mejs__button mejs__loop ${player.options.loop ? 'mejs__loop-on' : 'mejs__loop-off'}`
      })
      loop.appendChild(createElement('button', {
        type: 'button',
        'aria-controls': player.id,
        title: player.options.loopText
      }))
      controls.appendChild(loop)
      loop.addEventListener('click', () => {
        player.options.loop = !player.options.loop
        media.dispatchEvent(new Event('mep-looptoggle', [player.options.loop]))
        loop.classList.remove(player.options.loop ? 'mejs__loop-off' : 'mejs__loop-on')
        loop.classList.add(player.options.loop ? 'mejs__loop-on' : 'mejs__loop-off')
      })

      t.loopToggle = loop
    },
    loopToggleClick () {
      const t = this
      t.loopToggle.dispatchEvent(new Event('click'))
    },
    // SHUFFLE TOGGLE
    buildshuffle (player, controls, layers, media) {
      const t = this
      const shuffle = createElement('div', {
        class: `mejs__button mejs__shuffle-button ${(player.options.shuffle) ? 'mejs__shuffle-on' : 'mejs__shuffle-off'}`
      })
      const shuffleButton = createElement('button', {
        type: 'button',
        'aria-controls': player.id,
        title: player.options.shuffleText
      })
      shuffle.appendChild(shuffleButton)
      controls.appendChild(shuffle)
      shuffle.addEventListener('click', () => {
        player.options.shuffle = !player.options.shuffle
        media.dispatchEvent(new Event('mep-looptoggle', [player.options.loop]))
        shuffle.classList.remove(player.options.shuffle ? 'mejs__shuffle-off' : 'mejs__shuffle-on')
        shuffle.classList.add(player.options.shuffle ? 'mejs__shuffle-on' : 'mejs__shuffle-off')
      })

      t.shuffleToggle = shuffle
    },
    shuffleToggleClick () {
      const t = this
      t.shuffleToggle.dispatchEvent(new Event('click'))
    },
    // PREVIOUS TRACK BUTTON
    buildprevtrack (player, controls, layers, media) {
      const t = this
      const prevtrack = createElement('div', {
        class: 'mejs__button mejs__prevtrack-button mejs__prevtrack'
      })
      const button = createElement('button', {
        type: 'button',
        'aria-controls': player.id,
        title: player.options.prevText
      })
      prevtrack.appendChild(button)
      controls.appendChild(prevtrack)
      prevtrack.addEventListener('click', () => {
        media.dispatchEvent(new Event('mep-playprevtrack'))
        player.playPrevTrack()
      })

      t.prevTrack = prevtrack
    },
    prevTrackClick () {
      const t = this
      t.prevTrack.dispatchEvent(new Event('click'))
    },

    // NEXT TRACK BUTTON
    buildnexttrack (player, controls, layers, media) {
      const t = this
      const nexttrack = createElement('div', {
        class: 'mejs__button mejs__nexttrack-button mejs__nexttrack'
      })
      const button = createElement('button', {
        type: 'button',
        'aria-controls': player.id,
        title: player.options.nextText
      })
      nexttrack.appendChild(button)
      controls.appendChild(nexttrack)
      nexttrack.addEventListener('click', () => {
        media.dispatchEvent(new Event('mep-playnexttrack'))
        player.playNextTrack()
      })

      t.nextTrack = nexttrack
    },
    nextTrackClick () {
      const t = this
      t.nextTrack.dispatchEvent(new Event('click'))
    },

    // PLAYLIST TOGGLE
    buildplaylist (player, controls, layers, media) {
      const t = this
      const playlistToggle = createElement('div', {
        class: `mejs__button mejs__playlist-button ${(player.options.playlist) ? 'mejs__hide-playlist' : 'mejs__show-playlist'}`
      })
      const button = createElement('button', {
        type: 'button',
        'aria-controls': player.id,
        title: player.options.playlistText
      })
      playlistToggle.appendChild(button)
      controls.appendChild(playlistToggle)
      playlistToggle.addEventListener('click', () => {
        t.togglePlaylistDisplay(player, layers, media)
      })

      t.playlistToggle = playlistToggle
    },
    playlistToggleClick () {
      const t = this
      t.playlistToggle.dispatchEvent(new Event('click'))
    },
    // PLAYLIST WINDOW
    buildplaylistfeature (player, controls, layers, media) {
      const t = this
      const playlist = createElement('div', { class: 'mejs__playlist mejs__layer' })
      const listUl = createElement('ul', { class: 'mejs' })
      playlist.appendChild(listUl)
      layers.appendChild(playlist)
      // activate playlist display when data-showplaylist is set
      if (media.getAttribute('data-showplaylist')) {
        player.options.playlist = true
        // hide play overlay button
      }

      if (!player.options.playlist) {
        toggleDisplay(playlist, false)
      }

      const getTrackName = trackUrl => {
        const trackUrlParts = trackUrl.split('/')
        if (trackUrlParts.length > 0) {
          return decodeURIComponent(trackUrlParts[trackUrlParts.length - 1])
        } else {
          return ''
        }
      }

      // calculate tracks and build playlist
      const tracks = []
      let sourceIsPlayable
      let foundMatchingType = ''
      // $(media).children('source').each(function (index, element) { // doesn't work in Opera 12.12
      media.querySelectorAll('source')
      .forEach(function (el) {
      // $('#' + player.id).find('.mejs__mediaelement source').each(function () {
        sourceIsPlayable = el.parentNode.canPlayType(el.type)
        if (!foundMatchingType && (sourceIsPlayable === 'maybe' || sourceIsPlayable === 'probably')) {
          foundMatchingType = el.getAttribute('type')
        }
        if (!!foundMatchingType && el.getAttribute('type') === foundMatchingType) {
          if (el.src.trim() !== '') {
            const track = {}
            track.source = el.src.trim()
            const titleTrim = el.getAttribute('title').trim()
            if (titleTrim !== '') {
              track.name = titleTrim
            } else {
              track.name = getTrackName(track.source)
            }
            // add poster image URL from data-poster attribute
            track.poster = el.getAttribute('data-poster')
            tracks.push(track)
          }
        }
      })
      tracks.forEach(function(track){
        const thisLi = createElement('li', {
          'data-url': track.source,
          'data-poster': track.poster,
          title: track.name,
          'style.background-image': player.media.classList.contains('mep-slider') ? `url("${track.poster})"` : 'inherit'
        })
        const trackSpan = createElement('span', {})
        trackSpan.innerHTML = track.name
        thisLi.appendChild(trackSpan)
        listUl.appendChild(thisLi)
      })
      /* slider */
      player.videoSliderTracks = tracks.length

      // set the first track as current
      const firstItem = listUl.children[0]
      firstItem.classList.add('played')
      firstItem.classList.add('current')
      // set initial poster image - only for audio playlists
      if (player.media.matches('audio')) {
        player.changePoster(firstItem.getAttribute('data-poster'))
      }
      /* slider */
      const prevVid = createElement('a', {class: 'mep-prev'})
      const nextVid = createElement('a', {class: 'mep-prev'})

      player.videoSliderIndex = 0

      playlist.appendChild(prevVid)
      playlist.appendChild(nextVid)
      // setNodeAttributes(
      //   listUl.querySelectorAll('li'),
      //   {'style.transform': 'translate3d(0, -20px, 0) scale3d(0.75, 0.75, 1)'}
      // )
      toggleDisplay(prevVid, false)

      const previousNextHandler = () => {
        let moveMe = true

        player.videoSliderIndex -= 1
        if (player.videoSliderIndex < 0) {
          player.videoSliderIndex = 0
          moveMe = false
        }

        toggleFade(nextVid, player.videoSliderIndex !== player.videoSliderTracks - 1)
        toggleFade(prevVid, player.videoSliderIndex !== 0)

        if (moveMe === true) {
          player.sliderWidth = parseInt(getComputedStyle(document.getElementById(player.id)).width)
          setNodeAttributes(listUl.querySelectorAll('li'), {
            transform: `translate3d(-${Math.ceil(player.sliderWidth * player.videoSliderIndex)}px, -20px, 0) scale3d(0.75, 0.75, 1))`
          })
        }
      }
      prevVid.addEventListener('click', previousNextHandler) // initially hide prevVid button
      nextVid.addEventListener('click', previousNextHandler)

      // play track from playlist when clicking it
      layers.querySelectorAll('.mejs__playlist > ul li').forEach((el) => {
        el.addEventListener('click', function () {
          // pause current track or play other one
          if (!this.classList.contains('current')) {
            // clicked other track - play it
            this.classList.add('played')
            player.playTrack(this)
          } else {
            // clicked current track - play if paused and vice versa
            if (!player.media.paused) {
              // pause if playing
              player.pause()
            } else {
              // play if paused
              player.play()
            }
          }
        })
      })


      // when current track ends - play the next one
      media.addEventListener('ended', () => {
        player.playNextTrack()
      }, false)

      // set play and paused class to container
      media.addEventListener('playing', () => {
        player.container.classList.remove('mep-paused')
        player.container.classList.add('mep-playing')

        // hide playlist for videos
        if (media.matches('video')) {
          t.togglePlaylistDisplay(player, layers, media, 'hide')
        }
      }, false)

      /* mediaelement.js hides poster on "play" for all player types - not so great for audio */
      media.addEventListener('play', () => {
        if (player.media.matches('audio')) {
          layers.find('.mejs__poster').show()
        }
      }, false)

      media.addEventListener('pause', () => {
        player.container.classList.remove('mep-playing')
        player.container.classList.add('mep-paused')
      }, false)
    },
    playNextTrack () {
      const t = this
      let nxt
      const tracks = t.layers.querySelectorAll('.mejs__playlist > ul > li')
      const current = t.layers.querySelector('.mejs__playlist > ul > li.current')
      let notplayed = [...tracks].filter(el => !el.classList.contains('played'))

      if (notplayed.length < 1) {
        tracks.forEach(el => {
          el.classList.remove('played')
        })
        notplayed = [...tracks].filter(el => !el.classList.contains('current'))
      }
      if (t.options.shuffle) {
        const random = Math.floor(Math.random() * notplayed.length)
        nxt = notplayed[random]
      } else {
        nxt = current.nextElementSibling
        if (nxt.length === null && t.options.loop) {
          nxt = tracks[0]
        }
      }
      if (nxt) {
        nxt.classList.add('played')
        t.playTrack(nxt)
      }
    },
    playPrevTrack () {
      const t = this
      let prev
      const tracks = t.layers.querySelectorAll('.mejs__playlist > ul > li')
      const current = t.layers.querySelector('.mejs__playlist > ul > li.current')
      let played = [...tracks].filter(el => el.classList.contains('played') && !el.classList.contains('current'))
      if (played.length < 1) {
        current.classList.remove('played')
        played = [...tracks].filter(el => !el.classList.contains('current'))
      }
      if (t.options.shuffle) {
        const random = Math.floor(Math.random() * played.length)
        prev = played[random]
      } else {
        prev = current.previousElementSibling
        if (!prev && t.options.loop) {
          prev = tracks[tracks.length - 1]
        }
      }
      if (prev) {
        current.classList.remove('played')
        t.playTrack(prev)
      }
    },
    changePoster (posterUrl) {
      const t = this
      setNodeAttributes(t.layers.querySelector('.mejs__playlist'), {
        'background-image': `url("${posterUrl}")`
      })
      // also set actual poster
      t.setPoster(posterUrl)
      // make sure poster is visible (not the case if no poster attribute was set)
      toggleDisplay(t.layers.querySelector('.mejs__poster'), true)
    },
    playTrack (track) {
      const t = this
      t.pause()
      t.setSrc(track.getAttribute('data-url'))
      t.load()
      t.changePoster(track.getAttribute('data-poster'))
      t.play()
      const tracks = t.layers.querySelectorAll('.mejs__playlist > ul > li')
      tracks.forEach(el => {
        el.classList[el === track ? 'add' : 'remove']('current')
      })
    },
    playTrackURL (url) {
      const t = this
      const tracks = t.layers.querySelectorAll('.mejs__playlist > ul > li')
      const track = tracks.querySelector(`[data-url="${url}"]`)
      t.playTrack(track)
    },
    togglePlaylistDisplay (player, layers, media, showHide) {
      const t = this
      if (showHide) {
        player.options.playlist = showHide === 'show'
      } else {
        player.options.playlist = !player.options.playlist
      }
      media.dispatchEvent(new Event('mep-playlisttoggle', [player.options.playlist]))
      // toggle playlist display
      const isP = player.options.playlist
      toggleFade(layers.querySelector('.mejs__playlist'), isP)
      t.playlistToggle.classList.add(isP ? 'mejs__hide-playlist' : 'mejs__show-playlist')
      t.playlistToggle.classList.remove(isP ? 'mejs__show-playlist' : 'mejs__hide-playlist')
    }
  })
})()
