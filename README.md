# Design


## stash流程

1. 点击[stash all]按钮
2. 获取所有标签页标题、链接*及快照*
3. 将数据存入文件 
4. 关闭所有标签页
5. 显示目前已stash的所有标签页

## 数据存储格式
``json``格式存储：
```json
{
    "listSpace": [
        {
            "date": "when stashed them",
            "tabs": [
                {
                    "title",
                    "url"
                }
            ]
        }
    ]  
}

```

## 其他
文件存储格式：
```yaml
storage
    ├──storage.json
    └──snapshot
        └──"date" + "title".jpg
```