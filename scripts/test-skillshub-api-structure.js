/**
 * SkillsHub API 结构探测脚本
 * 
 * 用于查看实际的 API 响应结构
 */

fetch('https://api.skillhub.tencent.com/api/skills?page=1&pageSize=5&sortBy=score&order=desc')
  .then(r => r.json())
  .then(d => {
    console.log('=== 完整响应结构 ===');
    console.log(JSON.stringify(d, null, 2));
    
    console.log('\n=== data 字段结构 ===');
    console.log('data keys:', Object.keys(d.data));
    
    if (d.data.list) {
      console.log('\n✅ 有 list 字段');
      console.log('list 长度:', d.data.list.length);
      console.log('第一个元素:', d.data.list[0]);
    } else if (d.data.skills) {
      console.log('\n✅ 有 skills 字段');
      console.log('skills 长度:', d.data.skills.length);
      console.log('第一个元素:', d.data.skills[0]);
    } else if (d.data.items) {
      console.log('\n✅ 有 items 字段');
      console.log('items 长度:', d.data.items.length);
      console.log('第一个元素:', d.data.items[0]);
    } else {
      console.log('\n⚠️ 未找到列表字段，完整 data:');
      console.log(d.data);
    }
  })
  .catch(e => console.error('错误:', e))
