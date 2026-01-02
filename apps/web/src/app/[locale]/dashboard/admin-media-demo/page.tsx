'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music, 
  File, 
  Upload, 
  Search, 
  Grid, 
  List, 
  Folder,
  Download,
  Trash2,
  Eye,
  MoreVertical,
  HardDrive
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

interface MediaFile {
  id: number;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  folder: string;
  url?: string;
  thumbnail?: string;
}

const mockFiles: MediaFile[] = [
  { id: 1, name: 'logo-nukleo.png', type: 'image', size: 245000, uploadedAt: '2026-01-01T10:30:00', uploadedBy: 'Marie Dubois', folder: 'Branding' },
  { id: 2, name: 'presentation-q4.pdf', type: 'document', size: 1200000, uploadedAt: '2025-12-30T14:20:00', uploadedBy: 'Jean Martin', folder: 'Documents' },
  { id: 3, name: 'demo-produit.mp4', type: 'video', size: 15600000, uploadedAt: '2025-12-28T09:15:00', uploadedBy: 'Sophie Laurent', folder: 'Vidéos' },
  { id: 4, name: 'banniere-site.jpg', type: 'image', size: 890000, uploadedAt: '2025-12-27T16:45:00', uploadedBy: 'Pierre Durand', folder: 'Branding' },
  { id: 5, name: 'rapport-annuel.docx', type: 'document', size: 456000, uploadedAt: '2025-12-26T11:00:00', uploadedBy: 'Claire Petit', folder: 'Documents' },
  { id: 6, name: 'podcast-episode-12.mp3', type: 'audio', size: 8900000, uploadedAt: '2025-12-25T08:30:00', uploadedBy: 'Luc Bernard', folder: 'Audio' },
  { id: 7, name: 'icones-interface.svg', type: 'image', size: 34000, uploadedAt: '2025-12-24T15:20:00', uploadedBy: 'Emma Rousseau', folder: 'Design' },
  { id: 8, name: 'contrat-client-xyz.pdf', type: 'document', size: 678000, uploadedAt: '2025-12-23T10:10:00', uploadedBy: 'Thomas Blanc', folder: 'Contrats' },
  { id: 9, name: 'photo-equipe.jpg', type: 'image', size: 1200000, uploadedAt: '2025-12-22T13:45:00', uploadedBy: 'Marie Dubois', folder: 'Photos' },
  { id: 10, name: 'tutoriel-onboarding.mp4', type: 'video', size: 23400000, uploadedAt: '2025-12-21T09:00:00', uploadedBy: 'Jean Martin', folder: 'Vidéos' },
];

const typeConfig = {
  image: { label: 'Image', icon: ImageIcon, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  document: { label: 'Document', icon: FileText, color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  video: { label: 'Vidéo', icon: Video, color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  audio: { label: 'Audio', icon: Music, color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  other: { label: 'Autre', icon: File, color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
};

export default function AdminMediaDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredFiles = mockFiles.filter(file => {
    const matchesSearch = !searchQuery || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.folder.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || file.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const totalSize = mockFiles.reduce((sum, file) => sum + file.size, 0);
  const stats = {
    total: mockFiles.length,
    images: mockFiles.filter(f => f.type === 'image').length,
    documents: mockFiles.filter(f => f.type === 'document').length,
    videos: mockFiles.filter(f => f.type === 'video').length,
    totalSize: totalSize,
    storageUsed: (totalSize / (10 * 1024 * 1024 * 1024)) * 100 // Percentage of 10GB
  };

  return (
    <PageContainer>
      <MotionDiv variant="slideUp" duration="normal">
        {/* Hero Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Folder className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Bibliothèque de Médias
                  </h1>
                  <p className="text-white/80 text-sm">Gérez vos fichiers et documents</p>
                </div>
              </div>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                <Upload className="w-4 h-4 mr-2" />
                Uploader des fichiers
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <File className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.total}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Fichiers</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.images}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Images</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.documents}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Documents</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <Video className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.videos}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Vidéos</div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <HardDrive className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatFileSize(stats.totalSize)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{stats.storageUsed.toFixed(1)}% utilisé</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and View Toggle */}
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom ou dossier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Tous les types</option>
                <option value="image">Images</option>
                <option value="document">Documents</option>
                <option value="video">Vidéos</option>
                <option value="audio">Audio</option>
              </select>
              <div className="flex gap-1 border border-gray-300 dark:border-gray-700 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="px-2"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="px-2"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Files Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => {
              const TypeIcon = typeConfig[file.type].icon;
              return (
                <Card key={file.id} className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 hover:shadow-lg transition-all">
                  <div className="flex flex-col gap-3">
                    <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <TypeIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm truncate mb-1">{file.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${typeConfig[file.type].color} border text-xs`}>
                          {typeConfig[file.type].label}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        📁 {file.folder}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(file.uploadedAt)} • {file.uploadedBy}
                      </p>
                    </div>
                    <div className="flex gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button size="sm" variant="ghost" className="flex-1 hover:bg-blue-500/10 hover:text-blue-600">
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </Button>
                      <Button size="sm" variant="ghost" className="hover:bg-green-500/10 hover:text-green-600">
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="hover:bg-red-500/10 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card rounded-xl border border-[#A7A2CF]/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Taille</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Dossier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Uploadé</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredFiles.map((file) => {
                    const TypeIcon = typeConfig[file.type].icon;
                    return (
                      <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <TypeIcon className="w-5 h-5 text-gray-400" />
                            <span className="font-medium">{file.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${typeConfig[file.type].color} border`}>
                            {typeConfig[file.type].label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {file.folder}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>{formatDate(file.uploadedAt)}</div>
                          <div className="text-xs">{file.uploadedBy}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" className="hover:bg-blue-500/10 hover:text-blue-600">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="hover:bg-green-500/10 hover:text-green-600">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="hover:bg-red-500/10 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="hover:bg-gray-500/10">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </MotionDiv>
    </PageContainer>
  );
}
