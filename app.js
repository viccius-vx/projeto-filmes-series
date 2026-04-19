var isPlaying = false;

function updatePlayerView(player, newView) {
    newView = Math.floor(newView.position) + ':' + newView.duration;

    try {
        localStorage.setItem('player#' + player.id, newView);
    } catch (e) {}
}

function removePlayerView(player) {
    try {
        localStorage.removeItem('player#' + player.id);
    } catch (e) {}
}

function getPlayerView(player) {
    try {
        var view = localStorage.getItem('player#' + player.id);
    
        if (! view) return null;

        view = view.split(':');

        return { position: parseInt(view[0]), duration: parseFloat(view[1]) };
    } catch (e) {
        return null;
    }
}

function getPlayerPosition(player) {
    var view = getPlayerView(player);

    return (view && view.position) || 0;
}

function getPlayerDuration(player) {
    var view = getPlayerView(player);

    return (view && view.duration) || 0;
}

function showVideoJs(player) {
    var html = '<video id="player-videojs" class="video-js player-videojs vjs-big-play-centered player-content" controls preload="auto" data-setup=\'\'><source src="'+player.source+'" type="video/mp4" /><track kind="subtitles" label="Português" src="'+player.subtitles+'" srclang="pt" default /><p class="vjs-no-js">É necessário atualizar seu navegador.</p></video>';

    $('#player').html(html);

    videojs('player-videojs', {}, function () {
        var video = this;

        video.currentTime(getPlayerPosition(player));

        video.on('timeupdate', function () {
            updatePlayerView(
                player, 
                { position: video.currentTime(), duration: video.duration() }
            );
        });

        video.on('ended', function () {
            removePlayerView(player);
        });
    });
}

function showJwPlayer(player) {
    $('#player').html('<div class="player-content"><div id="player-jwplayer"></div></div>');

    var jw = jwplayer('player-jwplayer');
    
    jw.on('adError',function(e){console.log(e.message+' -- '+e.tag);});
    jw.on('adRequest',function(e){console.log('Just requested an ad: '+e.tag);});
    jw.on('adImpression',function(e){console.log('Ad impression! '+e.tag);});
    jw.on('adStarted',function(e){console.log('Ad started! '+e.tag);});

    jwplayer.key = gleam.config.jwplayer_key;

    var jwConfig = {
        width: '100%',
        height: '100%',
        file: player.source,
        tracks: [{
            file: player.subtitles,
            label: 'Português',
            default: true
        }],
        controls: true,
        playbackRateControls: true,
        type: 'video/mp4',
        autostart: false,
        mute: false,
        preload: 'auto',
        cast: {
            appid: gleam.config.jwplayer_cast_appid
        }
    };

    var videoUrls = gleam.config.ad_video_url.split(',');
    var videoUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];

    // Adiciona configuração de publicidade usando VAST XML somente após interação do usuário
    if (gleam.config.ad_enabled) {
        jwConfig.advertising = {
            client: 'vast',
            adscheduleid: 'Az87bY12',
            schedule: [{tag: videoUrl }],
            skipoffset: gleam.config.ad_skip_duration + 's'
        };
    }

    jw.setup(jwConfig);

    var position = getPlayerPosition(player);
    
    if (position < getPlayerDuration(player)) {
        jw.seek(position);
    }

    jw.on('time', function(e) {
        updatePlayerView(player, { position: e.position, duration: jw.getDuration() });
    });

    jw.on('complete', function() {
        removePlayerView(player);
    });

    var buttonId = 'download-video-button';
    var iconPath = '/static/img/download.svg';
    var tooltipText = 'Baixar Vídeo';

    jw.addButton(iconPath, tooltipText, function() {
        var playlistItem = jw.getPlaylistItem();
        var anchor = document.createElement('a');
        var fileUrl = playlistItem.file;
        anchor.setAttribute('href', fileUrl);
        var downloadName = playlistItem.file.split('/').pop();
        anchor.setAttribute('download', downloadName);
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    }, buttonId);

    // Reproduza o player somente após interação do usuário
    document.querySelector('#player-jwplayer').addEventListener('click', function () {
        if (!isPlaying) {
            jw.play(true);
        }
    });
}

function showIframe(player) {
    // Se anúncios estiverem desativados → abre direto o iframe
    if (!gleam.config.ad_enabled) {
        $('#player').html('<iframe src="' + player.source + '" allowfullscreen frameborder="0" class="player-iframe player-content"></iframe>');
        return;
    }

    // Detecta domínio do player
    var url = new URL(player.source);
    var domain = url.hostname;

    // Lista de domínios que devem ter pré-carregamento
    var domainsWithPreload = ["playembedapi.site", ""];
    var shouldPreload = domainsWithPreload.includes(domain);

    if (shouldPreload) {
        // Cria container do JWPlayer + pré-carrega o iframe escondido
        $('#player').html(`
            <div class="player-content">
                <div id="player-preroll"></div>
                <iframe id="real-iframe" src="${player.source}" allowfullscreen frameborder="0" class="player-iframe player-content" style="display:none;"></iframe>
            </div>
        `);
    } else {
        // Cria só o JWPlayer (iframe será criado depois)
        $('#player').html('<div class="player-content"><div id="player-preroll"></div></div>');
    }

    var jw = jwplayer('player-preroll');
    jwplayer.key = gleam.config.jwplayer_key;

    var videoUrls = gleam.config.ad_video_url.split(',');
    var videoUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];

    var jwConfig = {
        width: '100%',
        height: '100%',
        file: "/video/dummy.mp4", // dummy para rodar o anúncio
        controls: true,
        autostart: false, // espera clique do usuário
        advertising: {
            client: 'vast',
            schedule: [{ tag: videoUrl }],
            skipoffset: gleam.config.ad_skip_duration + 's'
        }
    };

    jw.setup(jwConfig);

    // Função para mostrar o iframe real (já carregado ou criado na hora)
    function openIframe() {
        if (shouldPreload) {
            $('#player-preroll').remove(); // remove o jwplayer
            $('#real-iframe').show(); // mostra o iframe já pronto
        } else {
            $('#player').html('<iframe src="' + player.source + '" allowfullscreen frameborder="0" class="player-iframe player-content"></iframe>');
        }
    }

    // Eventos do JWPlayer
    var adStarted = false;
    jw.on('adStarted', function() { adStarted = true; });
    jw.on('adImpression', function() { adStarted = true; });

    jw.on('adComplete', openIframe);
    jw.on('adSkipped', openIframe);
    jw.on('adError', openIframe);

    // Fallback só começa após o play do usuário
    jw.on('play', function() {
        setTimeout(function() {
            if (!adStarted) {
                openIframe();
            }
        }, 1500);
    });
}

function showPlyr(player) {
    var html = '<video id="player-plyr" controls playsinline><source src="'+player.source+'" type="video/mp4" />';

    if (player.subtitles) {
        html += '<track kind="subtitles" label="Português" src="'+player.subtitles+'" srclang="pt" default />';
    }

    html += '</video>';

    $('#player').html(html);

    var plyr = new Plyr('#player-plyr', {
        resetOnEnd: true
    });

    plyr.once('playing', function () {
        var position = getPlayerPosition(player);
    
        if (position < getPlayerDuration(player)) {
            plyr.currentTime = position;
        }
    });

    plyr.on('timeupdate', function () {
        updatePlayerView(
            player, 
            { position: plyr.currentTime, duration: plyr.duration }
        );
    });

    plyr.on('ended', function () {
        removePlayerView(player);
    });
}

function play(player) {
    isPlaying = true;

    switch (player.type) {
        case 'iframe':
            showIframe(player);
            break;
        case 'videojs':
            showVideoJs(player);
            break;
        case 'jwplayer':
            showJwPlayer(player);
            break;
        case 'plyr':
            showPlyr(player);
            break;
        default:
            alert('Tipo de player desconhecido.');
    }
}

function stopPlaying() {
    isPlaying = false;

    if ($('#player-videojs').length) {
        videojs('player-videojs').dispose();
    }
}

$('[data-episode-id]').click(function () {  
    var redirectEnabled = $('[data-redirect-enabled]').data('redirect-enabled') === true;
    var episodeId = $(this).data('episode-id');

    if (redirectEnabled) {
        var response = gleam.redirect({
            type: 'iframe',
            url: gleam.config.url + '/episodio/' + episodeId,
        });

        if (response !== false) return true;
    }

    $.get('/episodio/' + episodeId, function (html) {
        $('.main').hide();
        $('#play').show();
        $('#play').replaceWith(html);
        $('#play-back').show();
    });
});

$('body').on('click', '#play-back', function () {
    if (isPlaying) {
        stopPlaying();
        $('#player').css('display', 'none');
        $('#player').html('');
        $('#player-chooser').show();

        if (!$('.main').length) {
            $('#play-back').hide();
        }

        if ($('#player-chooser').length)
            return;
    }

    $('.main').show();
    $('#play').hide();
    $('#player').css('display', 'none');
});

$('body').on('click', '[data-show-player]', function () {
    $('#play-back').show();

    var $el = $(this);

    var source = $el.data('source');
    var subtitles = $el.data('subtitles');
    var type = $el.data('type');
    var id = $el.data('id');

    play({
        source: source,
        subtitles: subtitles,
        type: type,
        id: id
    });

    $('#player').css('display', 'block');
    $('#player-chooser').hide();
});

$('.header-navigation li').on('click', function() {
    if (! $(this).hasClass('selected')) {
        var seasonId = $(this).attr('data-season-id');

        var seasonNav = $('.header-navigation li[data-season-id=' + seasonId + ']');

        $('.header-navigation li.selected').removeClass('selected');
        seasonNav.addClass('selected');
        $('.d-none').removeClass('d-block');
        $('.d-none[data-season-id=' + seasonId +']').addClass('d-block');
        $('#season-title').text(seasonNav.attr('data-season-number') + 'º temporada');
    }
});