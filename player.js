import audio from '@system.audio'
import volume from '@system.volume'
import prompt from '@system.prompt'
import router from '@system.router';

import {
  storyDetail,
} from './service'
import {writeFile, readFile} from './file'
import {splitString} from './utils.js'
import { sendBehaviorData } from './analytics'

/**
 * 播放器状态
 */
export const AG_AUDIO_PLAY_STATUS = {
  UNKNOWN: 'unknow', // 未知错误
  PAUSE: 'pause', // 暂停播放
  ENDED: 'ended', // 播放完成
  STOP: 'stop', // 停止播放
  ERROR: 'error', // 播放出错
  PLAYING: 'play', // 播放中
  EXCEED_FIRST: 'exceed_first', //已经是第一首
  EXCEED_LAST: 'exceed_last',   //已经是最后一首
}

export class Player {
  constructor () {
    this.seeking = false    // 是否处于seek状态
    this.timeupdateData = {
    },
    this.currentTime = 0,   //当前单曲播放时长
    this.totalPlayingTime = 0 //当前播放累加时长
    this.overTimeLimit = 1800  //播放时长限制30分钟，1800
    this.played = false     //是否正在播放
    this.loaded = false     //是否已加载
    this.collectId = '' // 播放专辑id
    this.list = [] // 专辑列表
    this.currentIndex = 0   // 专辑列表下标
    this.title = '' // 专辑信息
    this.subTitle = '' // 单曲信息
    this.volume = 0.5 // 音量
    this.timeLimitCB = null // 超过播放时间限制回调
    this.showOverTime = false // 是否超出播放时间
    this.location = '' // 页面来源
    this.collectData = null // 合辑数据

    this.initVolume()
    this.bindEvents()
  }

  init() {
    this.currentTime = 0
    this.totalPlayingTime = 0
    this.overTimeLimit = 1800
    this.list = []
    this.title = ''
    this.subTitle = ''
    this.timeLimitCB = null
    this.collectData = null
    this.location = ''
  }

  // 获取系统音量
  initVolume() {
    volume.getMediaValue({
      success: data => {
        console.log('getMediaValue:' + JSON.stringify(data))
        this.volume = data.value
      },
      fail: (data, code) => {
        console.log(`getMediaValue fail code=${code}`)
      }
    })
  }

  play () {
    audio.play()
  }

  pause () {
    audio.pause()
  }

  stop () {
    audio.stop()
  }

  setTimeLimitCB(cb) {
    this.timeLimitCB = cb
  }

  // 设置audio生命周期回调
  bindEvents () {
    audio.onloadeddata = (e) => {
      this.loaded = true;
    }

    audio.onplay = () => {
      console.log('onplay');
      this.played = true;
      this.loaded = true;
    }

    audio.onstop = () => {
      console.log('onstop');
      this.played = false;
    }

    audio.onpause = () => {
      console.log('onpause');
      this.played = false;
    }

    audio.onended = () => {
      console.log('onended');
      this.played = false;
      this.next()
      sendBehaviorData('storyfinishplay', this.getBehaviorParam())
      sendBehaviorData('story_85percentreading', this.getBehaviorParam())
    }

    audio.ontimeupdate = (data) => {
      this.timeupdateData = data
      const { currentTime } = data
      if (currentTime > 0) {
        this.currentTime = currentTime
        let totalPlayingTime = this.totalPlayingTime + currentTime
        console.log('totalPlayingTime:' + totalPlayingTime)
        if (totalPlayingTime > this.overTimeLimit) {
          this.pause()
          this.showOverTime = true
          if (this.timeLimitCB) {
            this.timeLimitCB()
          }
        } else {
          this.showOverTime = false
        }
      }
      console.log(this.played)
    }

    audio.error = () => {
      console.log('error');
      this.played = false;
      prompt.showToast({ message: '播放失败' });
    }
  }

  leave() {
    if (!this.played) {
      sendBehaviorData('storyfinishplay', this.getBehaviorParam())
      this.checkTime()
    }
  }

  checkTime() {
    const currentTime = Number(this.currentTime)
    const totalTime = Number(this.list[this.currentIndex].time)
    const percent = Math.floor((currentTime / totalTime) * 100)
    if (percent >= 85) {
      sendBehaviorData('story_85percentreading', this.getBehaviorParam())
    }
  }

  getBehaviorParam() {
    // story_id、collection_id、location、unlock_collection(0,1)、type(1,2,3,4,5)
    // story_id：听书单品id
    // collection_id：归属的合辑id
    // location：位置来源串
    // unlock_collection：是否登录解锁合辑
    // 0. 普通合辑
    // 1. 解锁合辑
    // type：类型
    // 1. 限免
    // 2. 试听
    // 3. 等免
    // 4. VIP
    // 5. 福利社限免（已领取未过期）
    const story_id = this.list[this.currentIndex].storyId
    const collection_id = this.collectId
    const location = this.location
    const unlock_collection = 0
    let type = 4
    if (this.collectData.extFlag === 256) {
      type = 2
    }
    return {
      story_id,
      collection_id,
      location,
      unlock_collection,
      type
    }
  }

  /**
   * 获取播放进度
   */
  getTimeUpdateData () {
    return this.timeupdateData
  }

  /**
   * 播放提示音频
   * @param {String} uri
   * @returns
   */
  playPrompt (uri) {
  }

  /**
   * 获取播放状态
   * @returns {AG_AUDIO_PLAY_STATUS}
   */
   getPlayStatus () {
    return new Promise((resolve, reject) => {
      console.log('getPlayStatus')
      audio.getPlayState({
        success: function (data) {
          console.log('getPlayStatus-success:' + JSON.stringify(data))
          resolve(data.state)
        },
        fail: function (data, code) {
          console.log('getPlayStatus-fail:' + JSON.stringify(data))
          reject(new Error(data || `returnPlayStatus() fail;code = ${code}`))
        }
      })
    })
  }

  /**
   * 播放器是否处于暂停状态
   */
   async isPaused () {
    const status = await this.getPlayStatus()
    const isPaused = ![
      AG_AUDIO_PLAY_STATUS.PLAYING,
    ].includes(status)

    return isPaused
  }

  /**
   * 设置音量
   * @param {Number} num 取值范围 0.0 - 1.0
   */
  setVolume (num) {
    this.volume = num
    volume.setMediaValue({
      value: num,
      success: function() {
        console.log('setMediaValue success')
      },
      fail: function(data, code) {
        console.log(`setMediaValue fail, code = ${code}`)
      }
    })
  }

  getVolume () {
    return audio.volume
  }

  /**
   * 获取播放列表
   * @returns {Array<Object>}
   */
  getlist () {
    return this.list
  }

  /**
   * 设置播放列表
   * @param {Array<{ sourceId: Number, sourceType: Number, downloadUrl: String }>} 播放列表
   * @param {String} 播放列表唯一标识
   * @param {Object} 播放列表附加信息
   */
  setList (list) {
    this.list = list
  }

  /**
   * 根据Index检查是否可以播放
   * @param {Number} index
   * @returns {Number} -2: 因收费无法播放 -1: 其他原因无法播放 >=0: 可以播放
   */
  async playEnableByIndex (index) {
    if (isNaN(index) || index < 0) {
      return -1
    }

    const { list, playMeta } = this
    const itemData = list[index]

    if (!itemData || !itemData.downloadUrl) {
      return -1
    }

    try {
      const playEnable = await playEnableByExtFlag(playMeta.extFlag, itemData.extFlag)

      if (!playEnable) {
        return -2
      }
    } catch (error) {
      console.log('libs::player::playEnableByIndex playEnableByExtFlag Error:', error)
    }

    return index
  }

  /**
   * 根据列表序号播放
   * @param {Number} index
   */
  playByIndex (index, cb) {
    console.log('playByIndex-index:' + index)
    sendBehaviorData('storybeginplay', this.getBehaviorParam())
    this.playByItemData(index, cb)
  }

  playByItemData(index, cb) {
    const data = this.list[index]
    console.log('view/audio-player::playByItemData-data', data)
    const storyId = data.storyId
    const name = data.name
    this.stop()
    storyDetail(this.collectId, data.storyId).then(res => {
      console.log('view/audio-player-playByItemData-res', res)
      if (cb) {
        cb()
      }
      if (res.code == 200) {
        //如果有上一首，把上一首的播放时间加起来，单曲播放时间重置为0
        this.totalPlayingTime += this.currentTime
        this.currentTime = 0
        //播放
        let data = res.data
        audio.src = data.downloadUrl
        this.play()
        //单曲信息
        this.subTitle = splitString(name, 5)
        this.currentIndex = index
        //播放历史
        this.commitPlayHistory(storyId)
      } else if (res.code == 405) {
        //付费内容
        prompt.showToast({message: res.msg, duration: 1})
        setTimeout(() => {
          // this.handGoVipCenter()
          this.stop()
          router.push({uri: 'views/open-vip', params: {
            from: 3
          }})
        }, 1000)
      } else if (res.code == 403) {
        //登录失效
        prompt.showToast({message: '无权访问'})
        // setTimeout(() => {
        //   checkUserLogin(true, this.$app.$def.eventbus).then(res => {
        //     if (res) {
        //       router.push({uri: 'views/login'})
        //     }
        //   })
        // }, 1000)
      }
    }).catch(err => {
      if (cb) {
        cb()
      }
    })
  }

  /**
   * 提交播放历史记录
   */
  commitPlayHistory (storyId) {
    readFile().then(local => {
      let playHistory = local.playHistory
      if (typeof playHistory == 'string' && playHistory.length > 0) {
        let collect = playHistory.split('|')
        if (collect.length > 0) {
          for (let i = 0; i < collect.length; i++) {
            let history = collect[i].split(':')
            //已有历史，更新
            if (this.collectId == history[0]) {
              history[1] = storyId.toString()
              collect[i] = history.join(':')
              playHistory = collect.join('|')
              local.playHistory = playHistory
            } else {
              //未找到追加
              if (i == collect.length - 1) {
                local.playHistory = local.playHistory + '|' + this.collectId.toString() + ':' + storyId.toString()
              }
            }
          }
        } else {
          //初始
          local.playHistory = this.collectId.toString() + ':' + storyId.toString()
        }
      } else {
        //初始
        local.playHistory = this.collectId.toString() + ':' + storyId.toString()
      }
      console.log('view/audio-player::setHistory-local', local)
      writeFile(local)
    })
  }

  /**
   * 前一首
   */
  prev () {
    let index = this.currentIndex - 1
    if (index < 0) {
      console.log('已经是第一首')
      //循环播放
      index = this.list.length - 1
    }
    this.playByIndex(index)
  }

  /**
   * 下一首
   */
  next () {
    let index = this.currentIndex + 1
    console.log('handleNext-index:' + index)
    if (index >= this.list.length) {
      console.log('已经是最后一首')
      //循环播放
      index = 0
    }
    this.playByIndex(index)
  }

  /**
   * 是否存在下一首
   */
   hasNext () {
    let index = this.currentIndex + 1

    console.log('libs::player::hasNext return:', !!(this.list && this.list[index]))
    return !!(this.list && this.list[index])
  }

  /**
   * 是否存在上一首
   */
  hasPrev () {
    let index = this.currentIndex - 1

    console.log('libs::player::hasPrev return:', !!(this.list && this.list[index]))
    return !!(this.list && this.list[index])
  }
}