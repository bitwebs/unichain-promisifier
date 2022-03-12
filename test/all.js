const test = require('tape')
const unichain = require('@web4/unichain')
const ram = require('random-access-memory')

const { toPromises, unwrap } = require('..')

test('cb unichain -> promises, simple', async t => {
  const chain = unichain(ram, { valueEncoding: 'utf-8' })
  const wrapper = toPromises(chain)
  await wrapper.ready()
  await wrapper.append('hello world')
  const block = await wrapper.get(0)
  t.same(block, 'hello world')
  t.end()
})

test('cb unichain -> promises, events', async t => {
  const chain = unichain(ram, { valueEncoding: 'utf-8' })
  const wrapper = toPromises(chain)

  let ready = 0
  let appended = 0
  wrapper.on('ready', () => {
    ready++
  })
  wrapper.on('append', () => {
    appended++
  })

  await wrapper.ready()
  await wrapper.append('hello world')
  t.same(ready, 1)
  t.same(appended, 1)

  t.end()
})

test('double wrapping', async t => {
  const chain = unichain(ram, { valueEncoding: 'utf-8' })
  const wrapper = toPromises(toPromises(chain))
  await wrapper.ready()
  await wrapper.append('hello world')
  const block = await wrapper.get(0)
  t.same(block, 'hello world')
  t.end()
})

test('can unwrap', async t => {
  const chain = unichain(ram, { valueEncoding: 'utf-8' })
  const wrapper = toPromises(toPromises(chain))
  t.same(chain, unwrap(wrapper))
  t.same(chain, unwrap(chain))
  t.end()
})
