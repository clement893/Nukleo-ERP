'use client';

import { VideoPlayer, AudioPlayer, Card } from '@/components/ui';
import { PageHeader, PageContainer, Section, PageNavigation } from '@/components/layout';
import { logger } from '@/lib/logger';

export default function MediaContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Composants Média"
        description="Composants pour lire des vidéos et des fichiers audio"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Média' },
        ]}
      />

      <div className="space-y-8">
        <Section title="Video Player">
          <Card>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Lecteur vidéo avec contrôles complets : lecture/pause, volume, recherche, plein écran.
              </p>
              <VideoPlayer
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217"
                title="Big Buck Bunny"
                controls
                onPlay={() => logger.debug('Video playing')}
                onPause={() => logger.debug('Video paused')}
                onEnded={() => logger.debug('Video ended')}
                className="max-w-4xl mx-auto"
              />
            </div>
          </Card>
        </Section>

        <Section title="Video Player - Autoplay">
          <Card>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Lecteur vidéo avec lecture automatique (muted).
              </p>
              <VideoPlayer
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
                title="Elephants Dream"
                autoplay
                muted
                loop
                controls
                className="max-w-4xl mx-auto"
              />
            </div>
          </Card>
        </Section>

        <Section title="Audio Player">
          <Card>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Lecteur audio avec contrôles complets : lecture/pause, volume, recherche.
              </p>
              <AudioPlayer
                src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                title="Sample Audio Track"
                artist="SoundHelix"
                onPlay={() => logger.debug('Audio playing')}
                onPause={() => logger.debug('Audio paused')}
                onEnded={() => logger.debug('Audio ended')}
                className="max-w-2xl mx-auto"
              />
            </div>
          </Card>
        </Section>

        <Section title="Audio Player - Multiple Tracks">
          <Card>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Plusieurs lecteurs audio pour une playlist.
              </p>
              <div className="space-y-4">
                <AudioPlayer
                  src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                  title="Track 1"
                  artist="SoundHelix"
                  className="max-w-2xl mx-auto"
                />
                <AudioPlayer
                  src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
                  title="Track 2"
                  artist="SoundHelix"
                  className="max-w-2xl mx-auto"
                />
                <AudioPlayer
                  src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
                  title="Track 3"
                  artist="SoundHelix"
                  className="max-w-2xl mx-auto"
                />
              </div>
            </div>
          </Card>
        </Section>

        <Section title="Informations">
          <Card>
            <div className="space-y-4 text-foreground">
              <div>
                <h4 className="font-semibold mb-2">Composants disponibles:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>VideoPlayer:</strong> Lecteur vidéo avec contrôles complets, recherche, volume, plein écran
                  </li>
                  <li>
                    <strong>AudioPlayer:</strong> Lecteur audio avec contrôles complets, recherche, volume
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Utilisation:</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import { VideoPlayer, AudioPlayer } from '@/components/ui';

// Video Player
<VideoPlayer
  src="/path/to/video.mp4"
  poster="/path/to/poster.jpg"
  title="Video Title"
  controls
  onPlay={() => logger.debug('Playing')}
  onPause={() => logger.debug('Paused')}
/>

// Audio Player
<AudioPlayer
  src="/path/to/audio.mp3"
  title="Track Title"
  artist="Artist Name"
  onPlay={() => logger.debug('Playing')}
  onPause={() => logger.debug('Paused')}
/>`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Fonctionnalités:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Contrôles de lecture/pause</li>
                  <li>Contrôle du volume avec mute</li>
                  <li>Recherche dans la vidéo/audio</li>
                  <li>Avance/retour rapide (10 secondes)</li>
                  <li>Plein écran pour les vidéos</li>
                  <li>Support du mode sombre automatique</li>
                  <li>Callbacks pour les événements (play, pause, ended)</li>
                </ul>
              </div>
            </div>
          </Card>
        </Section>
      </div>

      <PageNavigation
        prev={{ label: 'Graphiques', href: '/components/charts' }}
        next={{ label: 'Données', href: '/components/data' }}
        home={{ label: 'Retour à l\'accueil', href: '/components' }}
      />
    </PageContainer>
  );
}

