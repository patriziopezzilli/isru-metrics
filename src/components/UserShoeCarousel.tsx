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
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Ridimensiona immagine lato client
  const resizeImage = (file: File, maxSize = 1024, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = e => {
        if (!e.target?.result) return reject('No result');
        img.onload = () => {
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round(height * (maxSize / width));
              width = maxSize;
            } else {
              width = Math.round(width * (maxSize / height));
              height = maxSize;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No canvas context');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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

  // Autoplay
  useEffect(() => {
    if (filteredPhotos.length < 2) return;
    const interval = setInterval(() => {
      setCurrent(prev => (prev < filteredPhotos.length - 1 ? prev + 1 : 0));
    }, 3500); // 3.5 secondi
    return () => clearInterval(interval);
  }, [filteredPhotos.length]);

  useEffect(() => {
    fetch('/api/user-shoes')
      .then(res => res.json())
      .then(data => {
        setPhotos(data.shoes || []);
        setLoading(false);
      });
  }, []);

  const handleUpload = async () => {
    if (!uploadImage || !uploadPreview) return;
    setUploading(true);
    // uploadPreview è già la versione ridimensionata in base64
    const imageBase64 = uploadPreview.split(',')[1];
    const res = await fetch('/api/user-shoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username && username.trim() ? username : 'Anonymous',
        shoeType: uploadShoeType,
        imageBase64
      })
    });
    if (res.ok) {
      setUploadOpen(false);
      setUploadImage(null);
      setUploadPreview(null);
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
  };

  // 1. Aggiungi una classe per la transizione
  const carouselImageStyle = {
    transition: 'transform 0.5s cubic-bezier(.4,0,.2,1), opacity 0.5s cubic-bezier(.4,0,.2,1)',
  };

  return (
  <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center" style={{ width: '100%' }}>
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
          <Box display="flex" alignItems="center" justifyContent="center" style={{ width: '100%', height: '180px', position: 'relative' }}>
            {/* Previous photo (peek) */}
            <Box style={{ width: 80, height: 120, overflow: 'hidden', opacity: 0.5, borderRadius: 8, marginRight: -24, zIndex: 1, background: '#f5f5f5', display: filteredPhotos.length > 1 ? 'block' : 'none' }}>
              {filteredPhotos.length > 1 && (
                <img
                  src={`data:image/jpeg;base64,${filteredPhotos[(current - 1 + filteredPhotos.length) % filteredPhotos.length].imageBase64}`}
                  alt="prev"
                  style={{ ...carouselImageStyle, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(1px)' }}
                />
              )}
            </Box>
            {/* Current photo */}
            <Box display="flex" flexDirection="column" alignItems="center" style={{ width: '220px', height: '180px', overflow: 'hidden', zIndex: 2, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '16px 0' }}>
              <img
                src={`data:image/jpeg;base64,${filteredPhotos[current].imageBase64}`}
                alt={filteredPhotos[current].shoeType}
                style={{ ...carouselImageStyle, width: '100%', height: '120px', objectFit: 'cover', borderRadius: 12, marginBottom: 12, marginTop: 8 }}
              />
              <Typography variant="caption" style={{ color: '#8b7355', fontWeight: 500, marginTop: 8, textAlign: 'center', width: '100%' }}>
                {filteredPhotos[current].username} - {filteredPhotos[current].shoeType}
              </Typography>
            </Box>
            {/* Next photo (peek) */}
            <Box style={{ width: 80, height: 120, overflow: 'hidden', opacity: 0.5, borderRadius: 8, marginLeft: -24, zIndex: 1, background: '#f5f5f5', display: filteredPhotos.length > 1 ? 'block' : 'none' }}>
              {filteredPhotos.length > 1 && (
                <img
                  src={`data:image/jpeg;base64,${filteredPhotos[(current + 1) % filteredPhotos.length].imageBase64}`}
                  alt="next"
                  style={{ ...carouselImageStyle, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(1px)' }}
                />
              )}
            </Box>
            {/* Navigation arrows */}
            <IconButton onClick={handlePrev} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}>
              <ArrowBackIos />
            </IconButton>
            <IconButton onClick={handleNext} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}>
              <ArrowForwardIos />
            </IconButton>
          </Box>
        )}
      </Box>

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
          {!uploadImage && !uploading && (
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const files = e.target.files;
                if (files && files[0]) {
                  resizeImage(files[0]).then(resizedDataUrl => {
                    setUploadImage(files[0]);
                    setUploadPreview(resizedDataUrl);
                  }).catch(() => {
                    setUploadImage(files[0]);
                    // fallback: mostra preview originale
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (typeof reader.result === 'string') setUploadPreview(reader.result);
                    };
                    reader.readAsDataURL(files[0]);
                  });
                } else {
                  setUploadImage(null);
                  setUploadPreview(null);
                }
              }}
              style={{ marginBottom: 12 }}
            />
          )}
          {uploadImage && !uploading && (
            <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
              {uploadPreview && (
                <img src={uploadPreview} alt="Preview" style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
              )}
              <Button variant="outlined" color="secondary" onClick={() => { setUploadImage(null); setUploadPreview(null); }} style={{ marginBottom: 8 }}>
                Change image
              </Button>
            </Box>
          )}
          {uploading ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" style={{ minHeight: 120 }}>
              <CircularProgress size={48} style={{ marginBottom: 12 }} />
              <Typography variant="body2" style={{ color: '#8b7355' }}>Uploading...</Typography>
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" width="100%">
              <Button
                variant="contained"
                color="primary"
                disabled={!uploadImage || uploading}
                onClick={handleUpload}
                style={{ backgroundColor: '#8b7355', color: 'white', borderRadius: 8, minWidth: 120 }}
              >
                Upload
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UserShoeCarousel;
