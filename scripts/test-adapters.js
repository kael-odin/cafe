/**
 * 测试 SkillsHub 和 ClawHub 适配器
 * 
 * 使用方法：
 * 在 Electron 应用中运行，或使用 Node.js 环境
 */

// ============================================
// SkillsHub API 测试
// ============================================

async function testSkillsHub() {
  console.log('\n=== 测试 SkillsHub API ===\n')

  try {
    const url = 'https://api.skillhub.tencent.com/api/skills?page=1&pageSize=5&sortBy=score&order=desc'
    console.log('请求 URL:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    console.log('✅ SkillsHub API 响应成功!')
    console.log('响应码:', data.code)
    console.log('消息:', data.message)
    
    if (data.code === 0) {
      console.log('\n📊 数据结构:')
      console.log('  - 总数:', data.data.total)
      console.log('  - 当前页:', data.data.page)
      console.log('  - 每页数量:', data.data.pageSize)
      
      // 检查实际的列表字段
      const list = data.data.list || data.data.skills || data.data.items || []
      console.log('  - 列表字段:', list.length > 0 ? '存在' : '不存在')
      console.log('  - 返回数量:', list.length)
      
      if (list.length > 0) {
        console.log('\n📝 第一个技能:')
        const first = list[0]
        console.log('  - 名称:', first.name || first.displayName)
        console.log('  - Slug:', first.slug)
        console.log('  - 作者:', first.author || first.ownerHandle)
        console.log('  - 描述:', (first.description || first.summary || '').substring(0, 100) + '...')
      }
    }
  } catch (error) {
    console.error('❌ SkillsHub API 测试失败:', error)
  }
}

// ============================================
// ClawHub API 测试
// ============================================

async function testClawHub() {
  console.log('\n=== 测试 ClawHub API ===\n')

  try {
    const requestBody = {
      path: 'skills:listPublicPageV4',
      format: 'convex_encoded_json',
      args: [{
        dir: 'desc',
        highlightedOnly: false,
        nonSuspiciousOnly: false,
        numItems: 5,
        sort: 'downloads',
      }],
    }

    console.log('请求体:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://wry-manatee-359.convex.cloud/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'convex-client': 'npm-1.34.1',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()
    
    console.log('✅ ClawHub API 响应成功!')
    console.log('状态:', data.status)
    
    if (data.status === 'success' && data.value) {
      console.log('\n📊 数据结构:')
      console.log('  - 是否有更多:', data.value.hasMore)
      console.log('  - 返回数量:', data.value.page.length)
      
      if (data.value.page.length > 0) {
        console.log('\n📝 第一个技能:')
        const first = data.value.page[0]
        console.log('  - 名称:', first.skill.displayName)
        console.log('  - Slug:', first.skill.slug)
        console.log('  - 作者:', first.owner.displayName)
        console.log('  - 下载量:', first.skill.stats.downloads)
        console.log('  - 星标:', first.skill.stats.stars)
        console.log('  - 描述:', first.skill.summary.substring(0, 100) + '...')
      }
    }
  } catch (error) {
    console.error('❌ ClawHub API 测试失败:', error)
  }
}

// ============================================
// 运行测试
// ============================================

async function runTests() {
  console.log('🧪 开始测试适配器...\n')
  console.log('='.repeat(60))

  await testSkillsHub()
  
  console.log('\n' + '='.repeat(60))
  
  await testClawHub()
  
  console.log('\n' + '='.repeat(60))
  console.log('\n🎉 测试完成!')
}

// 运行
runTests()
