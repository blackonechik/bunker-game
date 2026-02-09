'use client';

export function BackgroundVideo() {
  return (
    <>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 opacity-40"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 bg-zinc-950/50 z-0" />
    </>
  );
}
