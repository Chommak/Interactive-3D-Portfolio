// ============================================================
// แก้ไขข้อมูลส่วนตัวของเจ้าของพอร์ตโฟลิโอตรงนี้ที่เดียว
// ข้อมูลจะถูกนำไปแปะบนป้าย 3 มิติในฉาก + แผงข้อมูลตอนคลิก
// ============================================================
export const PROFILE = {
  nameTh: 'ปรินทร บุญจันทร์',
  nameEn: 'Parintorn Boonjan',
  nickname: 'ปอม',
  studentId: '6721651505',
  university: 'มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน',
  faculty: 'คณะศิลปศาสตร์และวิทยาศาสตร์',
  major: 'สาขาวิชาวิทยาการคอมพิวเตอร์ (ภาคพิเศษ)',
  bio: 'สวัสดีครับ ผม "ปอม" ปรินทร บุญจันทร์ นักศึกษาวิทยาการคอมพิวเตอร์ที่ชอบงานสร้างสรรค์ทุกแบบ — ตัดต่อวิดีโอ เขียนสคริปต์ ทำเว็บ และทำบอท Discord ตอนนี้กำลังสนุกกับการพาโลก 3D ขึ้นมาโลดแล่นบนเว็บด้วย Three.js ครับ',
  address: '',
  email: 'parintorn.b@ku.th',
  phone: '',
  socials: [
    { label: 'GitHub', url: 'https://github.com/Chommak' },
    { label: 'Instagram', url: 'https://www.instagram.com/KAIKA_EiEi' },
    { label: 'Facebook', url: 'https://www.facebook.com/Parintorn.Boonjan' },
  ],
  skills: ['Video Editing', 'Script Writing', 'Web Development', 'Discord Bot', 'Roblox Studio', 'Three.js', 'HTML/CSS', 'JavaScript'],
  projects: [
    {
      title: 'Script-to-Screen Reel',
      desc: 'งานคอนเทนต์วิดีโอที่ดูแลเองทุกขั้น — เขียนสคริปต์ วางสตอรี่บอร์ด ตัดต่อและใส่โมชันกราฟิกจนจบชิ้น เน้นจังหวะการเล่าเรื่องและซับไตเติลที่อ่านง่าย',
      tags: ['Video Editing', 'Script Writing', 'Storytelling'],
      color: '#f7a8c4',
      img: './assets/proj1.jpg',
    },
    {
      title: 'Anime 3D Portfolio',
      desc: 'เว็บไซต์พอร์ตโฟลิโอ 3 มิติชิ้นนี้สร้างด้วย Three.js ล้วน — ฉากไดโอรามะสไตล์อนิเมะแบบ cel shading, vertex shader กลีบซากุระปลิว realtime และระบบคลิกดูข้อมูลในฉาก',
      tags: ['Three.js', 'GLSL', 'WebGL'],
      color: '#8ec9f0',
      img: './assets/proj2.jpg',
    },
    {
      title: 'KU Camp Discord Bot',
      desc: 'บอท Discord สำหรับจัดการเซิร์ฟเวอร์ชมรม เขียนด้วย Node.js มีคำสั่งต้อนรับสมาชิกใหม่ สรุปประกาศอัตโนมัติ และมินิเกมสุ่มรางวัลให้เพื่อนในเซิร์ฟเวอร์',
      tags: ['Node.js', 'Discord API', 'Community'],
      color: '#b8e6a5',
      img: './assets/proj3.jpg',
    },
  ],
};
