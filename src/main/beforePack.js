const { rm } = require('fs/promises');
const keepHistory = (process.env['PACK_HISTORY'] === 'keep')

exports.default = async function (context) {
    console.log("------------------ Before Pack Hook ------------------")
    console.log(context)
    const { outDir, packager } = context
    const { info } = packager
    const { projectDir } = info
    //安全起见，打包输出目录，暂时限定必须在项目根目录下
    const isValid = outDir.includes(projectDir)
    if (!isValid) {
        console.log("安全起见: 打包输出目录，必须设置在项目根目录下！")
        return
    }
    const option = { recursive: true, force: true, maxRetries: 3 }
    if (!keepHistory) {
        console.log(option)
        //Nodejs之从入门到删系统跑路......
        rm(outDir, option)
    } 
    console.log("------------------ End Hook ------------------")
}