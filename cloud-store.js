class StudioCloudStore {
 constructor(client){this.client=client}
 async list(){const {data,error}=await this.client.from('studio_projects').select('id,name,updated_at,revision').order('updated_at',{ascending:false});if(error)throw error;return data}
 async load(id){const {data,error}=await this.client.from('studio_projects').select('*').eq('id',id).single();if(error)throw error;return data}
 async save({id,owner,revision,name,project,html}){
  const body={name,project,html};
  const query=revision===null?this.client.from('studio_projects').insert({...body,id,owner_id:owner}):this.client.from('studio_projects').update(body).eq('id',id).eq('revision',revision);
  const {data,error}=await query.select('id,revision,updated_at').maybeSingle();if(error)throw error;
  if(!data){const conflict=new Error('他の端末で更新されています。「別の作品として保存」で変更を残してから、最新版を開いてください。');conflict.code='CONFLICT';throw conflict}return data;
 }
}
