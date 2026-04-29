import { Router, Request, Response } from "express";
import { User } from "../models/User";
import { authRateLimiter } from "../middleware/authRateLimiter";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../services/token";
 

const router = Router();

router.post(
    "/register",
    authRateLimiter,
    async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;

    if(!name || !email || !password ){
        res.status(400).json({ success: false, error: "All fields are required "});
        return;
    }

    if(password.length < 8){
        res.status(400).json({ success: false, error: "length should be greater than 8"});
        return;
    }

    try{
        const existingUser = await User.findOne({ email });
        if(existingUser){
            res.status(409).json({ success: false, error: "email already registered" });
            return;
        }

        const user = await User.create({ name, email, password });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        res.status(201).json({
            success: true,
            data: {
                user: { id: user._id, name: user.name, email: user.email },
                accessToken,
                refreshToken
            },
        });
    } catch (err){
        res.status(500).json({ success: false, error: "server error "});
    }
});

router.post("/login",
    authRateLimiter,
    async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if(!email || !password){
        res.status(400).json({ success: false, error: "Email and password required "});
        return;
    }

    try{
        const user = await User.findOne({ email });
        if(!user){
            res.status(401).json({ success: false, error: "Invalid Credentials"});
            return;
        }

        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            res.status(401).json({ success: false, error: "Invalid credentials"});
            return;
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            data: { 
                user: { id: user._id, name: user.name, email: user.email },
                accessToken: newAccessToken, 
                refreshToken: newRefreshToken
            },
        });        
    } catch (err){
        res.status(500).json({ success: false, error: "Server error"});
    }
});

//api/auth/refresh
router.post("/refresh", async (req: Request, res: Response) : Promise<void> => {
    const { refreshToken } = req.body;

    if(!refreshToken){
        res.status(400).json({ success: false, error: "Refresh token required "})
        return;
    }
    
    try{
        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findOne({_id: decoded.userId});

        if(!user || user.refreshToken !== refreshToken){
            res.status(401).json({ success: false, error: "invalid refresh token"})
            return;
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({
            success: true, 
            data: { accessToken: newAccessToken, refreshToken: newRefreshToken},
        });
    } catch(err){
        res.status(401).json({ success: false, error: "invalid or expired refresh token"} )
    }
});


//Post api/auth/logout

router.post("/logout", async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  try {
    // 📚 LEARN: Logout = wipe refresh token from DB
    // Even if someone stole it, it won't work anymore
    await User.findOneAndUpdate(
      { refreshToken },
      { refreshToken: null }
    );
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;