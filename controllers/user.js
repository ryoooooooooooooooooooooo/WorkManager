export const getUser = (req, res) => {
    // 後で使う
    const user = {
        id: 1,
        studentId: 1234567,
        name: "田中　太郎"
    }
    res.json(user);
};