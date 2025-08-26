import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Box, Typography, Button, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, TextField, MenuItem, InputAdornment } from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos, AddAPhoto, Search as SearchIcon, Clear as ClearIcon } from '@material-ui/icons';

const SHOE_TYPES = [
  { value: 'General Purpose Shoe', label: 'General Purpose Shoe' },
  { value: 'Mars Yard', label: 'Mars Yard' }
];

interface UserShoePhoto {
  username: string;
  shoeType: string;
  imageBase64: string;
  createdAt: string;
}

interface Props {
  username: string;
}

const UserShoeCarousel: React.FC<Props> = ({ username }) => {
  const [photos, setPhotos] = useState<UserShoePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadShoeType, setUploadShoeType] = useState(SHOE_TYPES[0].value);
  const [uploadImage, setUploadImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/user-shoes')
      .then(res => res.json())
      .then(data => {
        setPhotos(data.shoes || []);
        setLoading(false);
      });
  }, []);

  // Filtra le foto per username o tipo scarpa
  const filteredPhotos = useMemo(() => {
    if (!searchTerm.trim()) return photos;
    const term = searchTerm.toLowerCase();
    return photos.filter(photo =>
      photo.username.toLowerCase().includes(term) ||
      photo.shoeType.toLowerCase().includes(term)
    );
  }, [photos, searchTerm]);

  const handlePrev = () => setCurrent(current > 0 ? current - 1 : filteredPhotos.length - 1);
  const handleNext = () => setCurrent(current < filteredPhotos.length - 1 ? current + 1 : 0);

  const handleUpload = async () => {
    if (!uploadImage) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        const imageBase64 = reader.result.split(',')[1];
        const res = await fetch('/api/user-shoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            shoeType: uploadShoeType,
            imageBase64
          })
        });
        if (res.ok) {
          setUploadOpen(false);
          setUploadImage(null);
          setUploading(false);
          // Refresh photos
          setLoading(true);
          fetch('/api/user-shoes')
            .then(res => res.json())
            .then(data => {
              setPhotos(data.shoes || []);
              setLoading(false);
              setCurrent(0);
            });
        } else {
          alert('Upload failed');
          setUploading(false);
        }
      }
    };
    if (uploadImage) reader.readAsDataURL(uploadImage);
  };

  return (
  <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center" style={{ width: '100%' }}>
      <Typography variant="h6" style={{ marginBottom: 8, color: '#8b7355', fontWeight: 600 }}>
        Camp WDYWT
      </Typography>
      {/* Search + Upload affiancati, larghezza massima come il box */}
      <Box display="flex" alignItems="center" justifyContent="center" style={{ width: '100%', maxWidth: 600, marginBottom: 12 }}>
        <TextField
          className="user-shoe-search"
          label="Search by user or shoe type..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrent(0);
          }}
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon style={{ color: '#8b7355' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => { setSearchTerm(''); setCurrent(0); }} style={{ color: '#8b7355' }}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          style={{ backgroundColor: 'white', borderRadius: 12, minWidth: 200, marginRight: 10 }}
        />
        <IconButton
          color="primary"
          style={{ backgroundColor: '#8b7355', color: 'white', borderRadius: 8, width: 40, height: 40, boxShadow: '0 2px 8px rgba(139,115,85,0.12)' }}
          onClick={() => setUploadOpen(true)}
        >
          <AddAPhoto style={{ fontSize: 22 }} />
        </IconButton>
      </Box>
  <Box display="flex" alignItems="center" justifyContent="center" style={{ width: '100%', maxWidth: 600, minHeight: 180, position: 'relative', background: '#fefdfb', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
        {loading ? (
          <CircularProgress />
        ) : filteredPhotos.length === 0 ? (
          <Typography variant="body2" style={{ color: '#8b7355' }}>No photos found.</Typography>
        ) : (
          <>
            <IconButton onClick={handlePrev} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
              <ArrowBackIos />
            </IconButton>
            <Box display="flex" flexDirection="column" alignItems="center" style={{ width: '220px', height: '180px', overflow: 'hidden' }}>
              <img
                src={`data:image/jpeg;base64,${filteredPhotos[current].imageBase64}`}
                alt={filteredPhotos[current].shoeType}
                style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 12, marginBottom: 6 }}
              />
              <Typography variant="caption" style={{ color: '#8b7355', fontWeight: 500 }}>
                {filteredPhotos[current].username} - {filteredPhotos[current].shoeType}
              </Typography>
            </Box>
            <IconButton onClick={handleNext} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
              <ArrowForwardIos />
            </IconButton>
          </>
        )}
      </Box>
      <IconButton
        color="primary"
        style={{ marginTop: 12, backgroundColor: '#8b7355', color: 'white', borderRadius: 8, width: 40, height: 40, boxShadow: '0 2px 8px rgba(139,115,85,0.12)' }}
        onClick={() => setUploadOpen(true)}
      >
        <AddAPhoto style={{ fontSize: 22 }} />
      </IconButton>
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Upload your shoe photo</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Shoe Type"
            value={uploadShoeType}
            onChange={e => setUploadShoeType(e.target.value)}
            fullWidth
            style={{ marginBottom: 12 }}
          >
            {SHOE_TYPES.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const files = e.target.files;
              if (files && files[0]) setUploadImage(files[0]);
              else setUploadImage(null);
            }}
            style={{ marginBottom: 12 }}
          />
          <Button
            variant="contained"
            color="primary"
            disabled={!uploadImage || uploading}
            onClick={handleUpload}
            style={{ backgroundColor: '#8b7355', color: 'white', borderRadius: 8 }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UserShoeCarousel;
