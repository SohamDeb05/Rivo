'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const SEPARATION = 150;
		const AMOUNTX = 40;
		const AMOUNTY = 60;

		const scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0x000000, 2000, 10000);

		const camera = new THREE.PerspectiveCamera(
			60,
			window.innerWidth / window.innerHeight,
			1,
			10000,
		);
		camera.position.set(0, 355, 1220);

		const renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true,
		});
		// Cap pixel ratio to 2 for performance on high-DPI screens (e.g. retina)
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(window.innerWidth, window.innerHeight);

		// Pause animation when component is off-screen
		let isVisible = true;
		const observer = new IntersectionObserver((entries) => {
			isVisible = entries[0].isIntersecting;
		});
		observer.observe(container);
		// Transparent background
		renderer.setClearColor(0x000000, 0);

		container.appendChild(renderer.domElement);

		const positions: number[] = [];
		const colors: number[] = [];
		const geometry = new THREE.BufferGeometry();

		for (let ix = 0; ix < AMOUNTX; ix++) {
			for (let iy = 0; iy < AMOUNTY; iy++) {
				const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
				const y = 0;
				const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

				positions.push(x, y, z);
				// Colors must be normalized floats (0.0 to 1.0) for WebGL!
				colors.push(0.6, 0.6, 0.6); 
			}
		}

		const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
		// Crucial for performance and preventing freezes in modern Three.js!
		positionAttribute.setUsage(THREE.DynamicDrawUsage);
		
		geometry.setAttribute('position', positionAttribute);
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

		const material = new THREE.PointsMaterial({
			size: 8,
			vertexColors: true,
			transparent: true,
			opacity: 0.8,
			sizeAttenuation: true,
		});

		const points = new THREE.Points(geometry, material);
		scene.add(points);

		let count = 0;
		let animationId: number;

		const animate = () => {
			animationId = requestAnimationFrame(animate);

			// Skip heavy rendering and math if the canvas isn't visible
			if (!isVisible) return;

			const positionsArray = geometry.attributes.position.array as Float32Array;

			// Precompute sine waves to reduce Math.sin calls from 4800 to 100 per frame
			const sinX = new Float32Array(AMOUNTX);
			for (let ix = 0; ix < AMOUNTX; ix++) {
				sinX[ix] = Math.sin((ix + count) * 0.3) * 50;
			}
			const sinY = new Float32Array(AMOUNTY);
			for (let iy = 0; iy < AMOUNTY; iy++) {
				sinY[iy] = Math.sin((iy + count) * 0.5) * 50;
			}

			let i = 0;
			for (let ix = 0; ix < AMOUNTX; ix++) {
				const sx = sinX[ix];
				for (let iy = 0; iy < AMOUNTY; iy++) {
					const index = i * 3;
					positionsArray[index + 1] = sx + sinY[iy];
					i++;
				}
			}

			geometry.attributes.position.needsUpdate = true;
			
			// Also rotate the entire particle system slowly
			points.rotation.x += 0.001;
			points.rotation.y -= 0.002;
			
			renderer.render(scene, camera);
			count += 0.1;
		};

		const handleResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);
		animate();

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', handleResize);
			cancelAnimationFrame(animationId);
			
			geometry.dispose();
			material.dispose();
			
			// Forcefully release the WebGL context
			const gl = renderer.getContext();
			const extension = gl?.getExtension('WEBGL_lose_context');
			if (extension) {
				extension.loseContext();
			}
			renderer.dispose();
			
			if (container && renderer.domElement && container.contains(renderer.domElement)) {
				container.removeChild(renderer.domElement);
			}
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className={cn('pointer-events-none fixed inset-0 -z-10', className)}
			{...props}
		/>
	);
}
