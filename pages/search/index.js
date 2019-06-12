// pages/search/index.js
import { Http, Validator } from '../../utils/common.js';
Page({
    http: new Http(),
    validator: new Validator(),
    /**
     * 页面的初始数据
     */
    data: {
        leftList: ['移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备', '移动设备'],
        activeLeft: 0,
        letters: {
            list: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            chosen: null,
            chosenIdx: -1,
        },
        groups: [{
                groupName: 'A',
                users: [{
                    name: '阿码',
                    avatar: '../../images/avatar.png'
                }]
            },
            {
                groupName: 'B',
                users: [{
                        name: '白娘子',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '包天齐',
                        avatar: '../../images/avatar.png'
                    }
                ]
            },
            {
                groupName: 'C',
                users: [{
                        name: '陈大年',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '丛云山',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '崔鸣贵',
                        avatar: '../../images/avatar.png'
                    }
                ]
            },
            {
                groupName: 'D',
                users: [{
                        name: '邓牛牛',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '刁仁衣',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '杜长城',
                        avatar: '../../images/avatar.png'
                    }
                ]
            },
            {
                groupName: 'F',
                users: [{
                        name: '范长龙',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '冯肖晓',
                        avatar: '../../images/avatar.png'
                    }
                ]
            },
            {
                groupName: 'G',
                users: [{
                        name: '甘地',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '高墙',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '宫都举',
                        avatar: '../../images/avatar.png'
                    }
                ]
            },
            {
                groupName: 'H',
                users: [{
                        name: '何芸',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '胡坨坨',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '黄坨坨',
                        avatar: '../../images/avatar.png'
                    }
                ]
            },
            {
                groupName: 'T',
                users: [{
                        name: '谭老头儿',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '汤云西',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '图图',
                        avatar: '../../images/avatar.png'
                    }
                ]
            },
            {
                groupName: 'X',
                users: [{
                        name: '夏一天',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '鲜轰轰',
                        avatar: '../../images/avatar.png'
                    },
                    {
                        name: '谢大佩',
                        avatar: '../../images/avatar.png'
                    }
                ]
            }
        ],
        letterHeight: 25,
        startY: 0,
        endY: 0,
        beforeIdx: -1,
        beforeChosenIdx: -1,

        showToast: false,
        showToastDur: 300,
        toastTimer: null,
    },

    bindtouchstart: function(e) {
        console.log(Array.prototype.slice.call(arguments));
        !!this.data.toastTimer && clearTimeout(this.data.toastTimer);
        this.setData({
            showToast: true,
            ["letters.chosenIdx"]: e.target.dataset['index'],
            startY: e.touches[0].clientY,
            beforeIdx: 0,
            beforeChosenIdx: e.target.dataset['index'],
        })
    },
    touchmove: function(e) {
        let index = Math.round((e.touches[0].clientY - this.data.startY) / this.data.letterHeight);
        if (index == this.data.beforeIdx || index + this.data.beforeChosenIdx < 0 || index + this.data.beforeChosenIdx > this.data.letters.list.length - 1) {
            return;
        } else {
            // console.log('moving');
            this.setData({
                ["letters.chosenIdx"]: index + this.data.beforeChosenIdx,
                endY: e.touches[0].clientY,
                beforeIdx: index,
            })
        }
        // console.log(index, this.data.letters.chosenIdx);
    },
    bindtouchcancel: function(e) {
        this.setData({
            showToast: false,
        })
    },
    /**
     * 点击某个字母触发选中事件 单次点击
     */
    letterOnceClick: function(e) {
        // console.log('click');
        // !!this.data.toastTimer && clearTimeout(this.data.toastTimer);
        // this.setData({
        //     showToast: true,
        //     ["letters.chosenIdx"]: e.target.dataset['index']
        // });
        // this.data.toastTimer = setTimeout(() => {
        //     this.setData({
        //         showToast: false,
        //     });
        //     !!this.data.toastTimer && clearTimeout(this.data.toastTimer);
        // }, this.data.showToastDur);
    },
    chooseLeft: function(e) {
        // this.setData({
        //     activeLeft: e.target.dataset['index'],
        // });
        // this.http.get();
        // this.validator
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})