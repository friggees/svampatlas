import {z} from 'zod';
export const profileSchema=z.object({username:z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,24}$/),display_name:z.string().trim().min(2).max(60),bio:z.string().trim().max(300)});
export const postSchema=z.object({id:z.uuid().optional(),body:z.string().trim().min(1).max(3000),area_id:z.uuid().nullable().default(null)});
export const sharingSchema=z.object({id:z.uuid(),visibility:z.enum(['private','friends','public']),friends:z.array(z.uuid()).max(100).default([])}).refine(x=>x.visibility!=='friends'||x.friends.length>0);
export const IMAGE_LIMIT=3*1024*1024;
export const IMAGE_COUNT=4;
export const IMAGE_TYPES=['image/jpeg','image/png','image/webp'];
