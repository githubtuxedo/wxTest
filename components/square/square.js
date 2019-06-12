// components/square/square.js
Component({
  /**
   * 组件的属性列表
   */

  //只有文本才会通过slot放到组件内部，其他的组件是直接作为兄弟组件，并不会放到组件内部 BUG
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  properties: {
    size: {             //长宽比尺寸  默认1 正方形
      type: Number,
      value: 1
    },
    wid: {              //组件宽度，默认100% 撑满
      type:String,
      value: '100%',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  /**
   * 组件的方法列表
   */
  methods: {

  },

  lifetimes: {
    attached() {
    },
    detached() {
      // 在组件实例被从页面节点树移除时执行
    },
  },
})
