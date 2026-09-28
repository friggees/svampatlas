'use client';

import {useState} from 'react';
import Image from 'next/image';

type Photo={src:string;alt:string;author:string;source:string;license:string;licenseUrl:string;width:number;height:number};

export function SpeciesGallery({name,photos}:{name:string;photos:Photo[]}) {
  const [selected,setSelected]=useState(0);
  const photo=photos[selected];
  return <div className="species-gallery" role="group" aria-label={`Bilder av ${name.toLocaleLowerCase('sv-SE')}`}>
    <a className="species-photo" href={photo.src} target="_blank" rel="noreferrer" aria-label={`Öppna bild ${selected+1} av ${name.toLocaleLowerCase('sv-SE')} i full storlek`}>
      <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 700px) 92vw, (max-width: 1100px) 70vw, 40vw"/>
      <span className="photo-count">{selected+1} / {photos.length} · Öppna bilden ↗</span>
    </a>
    <div className="photo-thumbnails">{photos.map((image,index)=><button key={image.src} type="button" aria-label={`Visa bild ${index+1} av ${name.toLocaleLowerCase('sv-SE')}`} aria-pressed={selected===index} onClick={()=>setSelected(index)}>
      <Image src={image.src} alt="" width={image.width} height={image.height} sizes="120px"/>
      <span>{index+1}</span>
    </button>)}</div>
    <p className="photo-credit" aria-live="polite">Foto: <a href={photo.source} target="_blank" rel="noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a></p>
  </div>;
}
