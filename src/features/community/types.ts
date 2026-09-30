import type {SavedArea} from '../saved-areas/schema';
export type Profile={id:string;username:string;display_name:string;bio:string;avatar_path:string|null};
export type Friendship={id:string;requester_id:string;recipient_id:string;status:'pending'|'accepted';created_at:string};
export type Post={id:string;author_id:string;body:string;status:'draft'|'published'|'hidden';area_id:string|null;created_at:string;profiles:Profile;community_images:{id:string;slot:number}[];saved_areas:SavedArea|null};
export type ActionResult={error?:string;success?:boolean;id?:string};
export type SharedPlace=SavedArea&{owner?:Profile};
