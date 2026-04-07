/**
 * SkillsHub API 测试脚本
 * 
 * 使用方法：
 * 1. 在浏览器控制台或 Node.js 环境中运行
 * 2. 测试 API 是否正常工作
 */

const API_BASE = 'https://api.skillhub.tencent.com/api'

async function testSkillsHubAPI() {
  console.log('🧪 开始测试 SkillsHub API...\n')

  // 测试 1: 获取技能列表
  console.log('📋 测试 1: 获取技能列表')
  try {
    const url = `${API_BASE}/skills?page=1&pageSize=10&sortBy=score&order=desc`
    console.log(`请求 URL: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    console.log('✅ 请求成功!')
    console.log(`返回数据: ${JSON.stringify(data, null, 2)}`)
    
    if (data.code === 0) {
      console.log(`\n📊 统计信息:`)
      console.log(`  - 总数: ${data.data.total}`)
      console.log(`  - 当前页: ${data.data.page}`)
      console.log(`  - 每页数量: ${data.data.pageSize}`)
      console.log(`  - 返回数量: ${data.data.list.length}`)
      
      if (data.data.list.length > 0) {
        console.log(`\n📝 第一个技能:`)
        const first = data.data.list[0]
        console.log(`  - 名称: ${first.name}`)
        console.log(`  - Slug: ${first.slug}`)
        console.log(`  - 作者: ${first.author}`)
        console.log(`  - 描述: ${first.description?.substring(0, 100)}...`)
      }
    } else {
      console.error(`❌ API 返回错误: ${data.message}`)
    }
  } catch (error) {
    console.error('❌ 请求失败:', error)
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // 测试 2: 搜索技能
  console.log('🔍 测试 2: 搜索技能 (关键词: web)')
  try {
    const url = `${API_BASE}/skills?page=1&pageSize=10&keyword=web&sortBy=score&order=desc`
    console.log(`请求 URL: ${url}`)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    console.log('✅ 请求成功!')
    console.log(`找到 ${data.data.total} 个结果`)
    
    if (data.data.list.length > 0) {
      console.log(`\n📝 搜索结果:`)
      data.data.list.slice(0, 3).forEach((skill, index) => {
        console.log(`  ${index + 1}. ${skill.name} (${skill.slug})`)
      })
    }
  } catch (error) {
    console.error('❌ 搜索失败:', error)
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // 测试 3: 分页
  console.log('📄 测试 3: 分页测试')
  try {
    const page1Url = `${API_BASE}/skills?page=1&pageSize=5&sortBy=score&order=desc`
    const page2Url = `${API_BASE}/skills?page=2&pageSize=5&sortBy=score&order=desc`
    
    const [page1, page2] = await Promise.all([
      fetch(page1Url).then(r => r.json()),
      fetch(page2Url).then(r => r.json()),
    ])

    console.log('✅ 分页测试成功!')
    console.log(`  - 第 1 页: ${page1.data.list.length} 个技能`)
    console.log(`  - 第 2 页: ${page2.data.list.length} 个技能`)
    
    // 检查是否有重复
    const page1Slugs = new Set(page1.data.list.map(s => s.slug))
    const page2Slugs = new Set(page2.data.list.map(s => s.slug))
    const hasOverlap = [...page1Slugs].some(slug => page2Slugs.has(slug))
    
    if (hasOverlap) {
      console.warn('⚠️  警告: 第 1 页和第 2 页有重复的技能')
    } else {
      console.log('✅ 分页正常，无重复')
    }
  } catch (error) {
    console.error('❌ 分页测试失败:', error)
  }

  console.log('\n🎉 测试完成!')
}

// 运行测试
testSkillsHubAPI()
