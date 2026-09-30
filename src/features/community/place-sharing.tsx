'use client';

import {useState, useTransition} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {sharePlace} from './actions';
import type {Profile} from './types';
import type {SavedArea} from '../saved-areas/schema';

export const visibilityLabels = {private: 'Privat', friends: 'Valda vänner', public: 'Publik'};

export function PlaceSharing({area, friends, recipients}: {area: SavedArea; friends: Profile[]; recipients: string[]}) {
  const [visibility, setVisibility] = useState(area.visibility);
  const [selected, setSelected] = useState(recipients);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  return <details className="place-sharing"><summary>Delning: {visibilityLabels[area.visibility]}</summary>
    <form className="social-form" onSubmit={event => {
      event.preventDefault();
      startTransition(async () => {
        try {
          const result = await sharePlace({id: area.id, visibility, friends: selected});
          setMessage(result.error ?? 'Delningen är sparad.');
        } catch { setMessage('Delningen kunde inte sparas. Försök igen.'); }
      });
    }}>
      <Label htmlFor={`visibility-${area.id}`}>Vem får se platsen?</Label>
      <select id={`visibility-${area.id}`} value={visibility} onChange={event => setVisibility(event.target.value as SavedArea['visibility'])}>
        <option value="private">Bara jag</option><option value="friends">Valda vänner</option><option value="public">Alla – publik plats</option>
      </select>
      {visibility === 'friends' && <fieldset><legend>Välj vänner</legend>
        {friends.length ? friends.map(friend => <label className="friend-choice" key={friend.id}>
          <input type="checkbox" checked={selected.includes(friend.id)} onChange={event => setSelected(current => event.target.checked ? [...current, friend.id] : current.filter(id => id !== friend.id))}/>
          <span>{friend.display_name} <small>@{friend.username}</small></span>
        </label>) : <p>Du behöver en accepterad vänförfrågan först. <Link href="/vanner" className="social-link">Hitta vänner</Link></p>}
      </fieldset>}
      {visibility === 'public' && <label className="friend-choice public-confirmation">
        <input key={visibility} type="checkbox" required/>
        <span>Jag vill visa platsens namn, anteckning och exakta koordinater för alla, även utan konto.</span>
      </label>}
      <p className="small-note">Att göra platsen privat återkallar åtkomsten. Redan kopierad information kan inte tas tillbaka.</p>
      <Button disabled={pending || (visibility === 'friends' && !selected.length)}>{pending ? 'Sparar…' : 'Spara delning'}</Button>
      <p role="status">{message}</p>
    </form>
  </details>;
}
