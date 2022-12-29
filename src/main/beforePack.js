const { rm } = require('fs/promises');

exports.default = async function (context) {
    console.log("------------------ Before Pack Hook ------------------")
    console.log(context)
    const { outDir, packager } = context
    const { projectDir } = packager.info
    //TODO 安全起见，打包输出目录，暂时限定必须在项目根目录下
    const isValid = outDir.includes(projectDir)
    if (!isValid) {
        console.log("安全起见: 打包输出目录，必须设置在项目根目录下！")
        return
    }
    const option = { recursive: true, force: true, maxRetries: 3 }
    rm(outDir, option) //Nodejs之从入门到删系统跑路......
    console.log("------------------ End Hook ------------------")
}